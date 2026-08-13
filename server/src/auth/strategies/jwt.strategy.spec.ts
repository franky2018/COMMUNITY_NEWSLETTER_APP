import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UserRole } from '../../../generated/prisma/enums';

describe('JwtStrategy', () => {
  const strategy = new JwtStrategy({
    getOrThrow: () => 'test-access-secret',
  } as unknown as ConfigService);

  it('maps a valid payload to the authenticated user context', () => {
    const user = strategy.validate({
      sub: 'user-1',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    });
    expect(user).toEqual({
      id: 'user-1',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    });
  });

  it('rejects a payload without a subject', () => {
    expect(() =>
      strategy.validate({ sub: '', email: 'x@example.com', role: UserRole.AUTHOR }),
    ).toThrow(UnauthorizedException);
  });
});
