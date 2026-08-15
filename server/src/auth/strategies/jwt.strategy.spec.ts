import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../../generated/prisma/enums';

describe('JwtStrategy', () => {
  const users = {
    findById: jest.fn(async (id: string) => ({
      id,
      email: 'admin@example.com',
      name: 'Admin',
      role: UserRole.ADMIN,
      isActive: true,
      tokenVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
  } as unknown as UsersService;

  const strategy = new JwtStrategy(
    { getOrThrow: () => 'test-access-secret' } as unknown as ConfigService,
    users,
  );

  it('maps a valid payload to the authenticated user context', async () => {
    const user = await strategy.validate({
      sub: 'user-1',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      tokenVersion: 0,
    });
    expect(user).toEqual({
      id: 'user-1',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    });
  });

  it('rejects a payload without a subject', async () => {
    await expect(
      strategy.validate({
        sub: '',
        email: 'x@example.com',
        role: UserRole.AUTHOR,
        tokenVersion: 0,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects inactive users', async () => {
    users.findById.mockResolvedValueOnce({
      id: 'user-1',
      email: 'admin@example.com',
      name: 'Admin',
      role: UserRole.ADMIN,
      isActive: false,
      tokenVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        tokenVersion: 0,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a payload whose token version is stale', async () => {
    await expect(
      strategy.validate({
        sub: 'user-1',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        tokenVersion: 5,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
