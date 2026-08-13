import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../../generated/prisma/enums';
import type { AuthenticatedUser } from '../types/auth.types';

function contextFor(user?: AuthenticatedUser): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const admin: AuthenticatedUser = {
    id: 'u1',
    email: 'a@example.com',
    role: UserRole.ADMIN,
  };
  const author: AuthenticatedUser = {
    id: 'u2',
    email: 'b@example.com',
    role: UserRole.AUTHOR,
  };

  function guardWith(required: UserRole[] | undefined): RolesGuard {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(required),
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  }

  it('allows access when no roles are required', () => {
    expect(guardWith(undefined).canActivate(contextFor(author))).toBe(true);
    expect(guardWith([]).canActivate(contextFor(author))).toBe(true);
  });

  it('allows access when the user role is permitted', () => {
    expect(guardWith([UserRole.ADMIN]).canActivate(contextFor(admin))).toBe(true);
  });

  it('denies access when the user role is not permitted', () => {
    expect(guardWith([UserRole.ADMIN]).canActivate(contextFor(author))).toBe(false);
  });

  it('denies access when there is no authenticated user', () => {
    expect(guardWith([UserRole.ADMIN]).canActivate(contextFor(undefined))).toBe(false);
  });
});
