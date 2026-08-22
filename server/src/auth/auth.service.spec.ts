import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../generated/prisma/enums';

// Real bcrypt compares (12-round timing guard) can exceed the default 5s under load.
jest.setTimeout(30000);

const TEST_CONFIG: Record<string, string> = {
  JWT_SECRET: 'test-access-secret',
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  JWT_REFRESH_EXPIRES_IN: '7d',
};

const PASSWORD = 'correct-password';
const passwordHash = bcrypt.hashSync(PASSWORD, 10);

const userRecord = {
  id: 'user-1',
  email: 'admin@example.com',
  name: 'Admin',
  role: UserRole.ADMIN,
  isActive: true,
  tokenVersion: 0,
  passwordHash,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const { passwordHash: _omit, ...safeUser } = userRecord;

describe('AuthService', () => {
  let service: AuthService;
  let jwt: JwtService;
  let users: {
    findByEmailWithHash: jest.Mock;
    findById: jest.Mock;
    incrementTokenVersion: jest.Mock;
  };

  beforeEach(async () => {
    users = {
      findByEmailWithHash: jest.fn(),
      findById: jest.fn(),
      incrementTokenVersion: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        { provide: UsersService, useValue: users },
        {
          provide: MailService,
          useValue: { sendPasswordResetEmail: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { getOrThrow: (k: string) => TEST_CONFIG[k] },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    jwt = moduleRef.get(JwtService);
  });

  describe('password hashing/verification', () => {
    it('accepts a correct password against its bcrypt hash', async () => {
      users.findByEmailWithHash.mockResolvedValue(userRecord);
      const result = await service.validateUser(userRecord.email, PASSWORD);
      expect(result).not.toBeNull();
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('rejects an incorrect password', async () => {
      users.findByEmailWithHash.mockResolvedValue(userRecord);
      const result = await service.validateUser(userRecord.email, 'wrong');
      expect(result).toBeNull();
    });

    it('returns null for an unknown email', async () => {
      users.findByEmailWithHash.mockResolvedValue(null);
      expect(
        await service.validateUser('nobody@example.com', PASSWORD),
      ).toBeNull();
    });

    it('returns null for an inactive user', async () => {
      users.findByEmailWithHash.mockResolvedValue({
        ...userRecord,
        isActive: false,
      });
      expect(await service.validateUser(userRecord.email, PASSWORD)).toBeNull();
    });
  });

  describe('login', () => {
    it('returns access and refresh tokens plus a safe user', async () => {
      users.findByEmailWithHash.mockResolvedValue(userRecord);
      const result = await service.login(userRecord.email, PASSWORD);

      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user.email).toBe(userRecord.email);
    });

    it('signs an access token carrying sub, email and role', async () => {
      users.findByEmailWithHash.mockResolvedValue(userRecord);
      const { accessToken } = await service.login(userRecord.email, PASSWORD);

      const payload = await jwt.verifyAsync(accessToken, {
        secret: TEST_CONFIG.JWT_SECRET,
      });
      expect(payload.sub).toBe(userRecord.id);
      expect(payload.email).toBe(userRecord.email);
      expect(payload.role).toBe(UserRole.ADMIN);
    });

    it('throws generic UnauthorizedException on wrong password', async () => {
      users.findByEmailWithHash.mockResolvedValue(userRecord);
      await expect(
        service.login(userRecord.email, 'wrong'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws generic UnauthorizedException on unknown email', async () => {
      users.findByEmailWithHash.mockResolvedValue(null);
      await expect(
        service.login('nobody@example.com', PASSWORD),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh-token validation', () => {
    it('issues fresh tokens for a valid refresh token and rotates the version', async () => {
      users.findByEmailWithHash.mockResolvedValue(userRecord);
      users.findById.mockResolvedValue(safeUser);
      users.incrementTokenVersion.mockResolvedValue({
        ...safeUser,
        tokenVersion: safeUser.tokenVersion + 1,
      });
      const { refreshToken } = await service.login(userRecord.email, PASSWORD);

      const tokens = await service.refresh(refreshToken);
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
      expect(users.incrementTokenVersion).toHaveBeenCalledWith(userRecord.id);
    });

    it('rejects a malformed refresh token', async () => {
      await expect(service.refresh('not-a-jwt')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects an access token used as a refresh token (wrong secret)', async () => {
      const accessToken = await jwt.signAsync(
        { sub: userRecord.id, email: userRecord.email, role: userRecord.role },
        { secret: TEST_CONFIG.JWT_SECRET, expiresIn: '15m' },
      );
      await expect(service.refresh(accessToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects when the user no longer exists', async () => {
      users.findByEmailWithHash.mockResolvedValue(userRecord);
      users.findById.mockResolvedValue(null);
      const { refreshToken } = await service.login(userRecord.email, PASSWORD);

      await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects a refresh token for an inactive user', async () => {
      users.findByEmailWithHash.mockResolvedValue(userRecord);
      users.findById.mockResolvedValue({ ...safeUser, isActive: false });
      const { refreshToken } = await service.login(userRecord.email, PASSWORD);

      await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejects a refresh token after the token version is bumped', async () => {
      users.findByEmailWithHash.mockResolvedValue(userRecord);
      users.findById.mockResolvedValue({ ...safeUser, tokenVersion: 1 });
      const { refreshToken } = await service.login(userRecord.email, PASSWORD);

      await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('increments the user token version', async () => {
      await service.logout('user-1');
      expect(users.incrementTokenVersion).toHaveBeenCalledWith('user-1');
    });
  });
});
