import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
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
  private readonly dummyPasswordHash = bcrypt.hashSync(
    'invalid-user-timing-guard',
    12,
  );

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
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
