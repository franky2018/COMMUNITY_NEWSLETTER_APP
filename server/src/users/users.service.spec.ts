import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../../generated/prisma/enums';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };

  beforeEach(async () => {
    prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };

    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  it('hashes the password before persisting and never stores plaintext', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'u1',
        email: data.email,
        name: data.name,
        role: data.role ?? UserRole.AUTHOR,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );

    await service.create({
      email: 'author@example.com',
      password: 'super-secret',
      name: 'Author',
    });

    const storedHash = prisma.user.create.mock.calls[0][0].data.passwordHash;
    expect(storedHash).toBeDefined();
    expect(storedHash).not.toBe('super-secret');
    expect(await bcrypt.compare('super-secret', storedHash)).toBe(true);
  });

  it('never returns the passwordHash on the created user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'u1',
      email: 'author@example.com',
      name: 'Author',
      role: UserRole.AUTHOR,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.create({
      email: 'author@example.com',
      password: 'super-secret',
      name: 'Author',
    });

    expect(result).not.toHaveProperty('passwordHash');
    // create is called with an explicit select that excludes passwordHash
    expect(prisma.user.create.mock.calls[0][0].select.passwordHash).toBeUndefined();
  });

  it('rejects a duplicate email with ConflictException', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.create({
        email: 'dupe@example.com',
        password: 'super-secret',
        name: 'Dupe',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
