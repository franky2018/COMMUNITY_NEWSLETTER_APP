import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { MailService } from '../mail/mail.service';
import { UsersService, type SafeUser } from '../users/users.service';
import type {
  AuthTokens,
  JwtPayload,
  JwtRefreshPayload,
} from './types/auth.types';

export interface LoginResult extends AuthTokens {
  user: SafeUser;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private static readonly PASSWORD_RESET_TTL_MS = 15 * 60 * 1000;

  private readonly dummyPasswordHash = bcrypt.hashSync(
    'invalid-user-timing-guard',
    12,
  );

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user = await this.users.findByEmailWithHash(email);
    if (!user || !user.isActive) {
      // Run a throwaway compare so response time doesn't reveal whether the
      // email maps to a real, active account.
      await bcrypt.compare(password, this.dummyPasswordHash);
      return null;
    }
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      return null;
    }
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.issueTokens(user);
    return { ...tokens, user };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtRefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.users.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (payload.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate: bump tokenVersion so the presented refresh token cannot be reused,
    // then issue the new pair on the incremented version.
    const rotated = await this.users.incrementTokenVersion(user.id);
    return this.issueTokens(rotated);
  }

  async logout(userId: string): Promise<void> {
    await this.users.incrementTokenVersion(userId);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.users.findByEmailForReset(email);
    // Silently no-op for unknown or inactive accounts: the controller returns
    // an identical response regardless, so the endpoint cannot be used to
    // probe which emails are registered.
    if (!user || !user.isActive) {
      return;
    }

    const rawToken = randomBytes(32).toString('base64url');
    const tokenHash = this.hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + AuthService.PASSWORD_RESET_TTL_MS);
    await this.users.setPasswordResetToken(user.id, tokenHash, expiresAt);

    const frontendUrl = this.config.getOrThrow<string>('FRONTEND_URL');
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${rawToken}`;

    try {
      await this.mail.sendPasswordResetEmail(user.email, resetUrl);
    } catch {
      // A delivery failure must neither surface to the caller (it would leak
      // account existence) nor throw. Log without the token/URL and let the
      // generic success response stand.
      this.logger.error(
        `Failed to dispatch password reset email for user ${user.id}`,
      );
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = this.hashResetToken(token);

    // Cheap rejection first so invalid tokens never trigger a bcrypt hash.
    const match = await this.users.findByActiveResetTokenHash(tokenHash);
    if (!match) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const updated = await this.users.completePasswordReset(
      tokenHash,
      newPassword,
    );
    // Zero rows means the token was consumed or expired between the lookup and
    // the write (e.g. a concurrent reset) — treat it the same as invalid.
    if (updated === 0) {
      throw new BadRequestException('Invalid or expired password reset token');
    }
  }

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async issueTokens(user: SafeUser): Promise<AuthTokens> {
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };
    const refreshPayload: JwtRefreshPayload = {
      sub: user.id,
      tokenVersion: user.tokenVersion,
    };

    const accessOptions = {
      secret: this.config.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.config.getOrThrow<string>('JWT_EXPIRES_IN'),
    } as JwtSignOptions;
    const refreshOptions = {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    } as JwtSignOptions;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, accessOptions),
      this.jwt.signAsync(refreshPayload, refreshOptions),
    ]);

    return { accessToken, refreshToken };
  }
}
