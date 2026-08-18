import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../../generated/prisma/enums';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe('create', () => {
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
    }, 30000);

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
    }, 30000);

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

    it('refuses to create an ADMIN account', async () => {
      await expect(
        service.create({
          email: 'admin@example.com',
          password: 'super-secret',
          name: 'Admin',
          role: UserRole.ADMIN,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('applies role and isActive filters and selects safe fields only', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.findAll({ role: UserRole.EDITOR, isActive: false });

      const args = prisma.user.findMany.mock.calls[0][0];
      expect(args.where).toEqual({ role: UserRole.EDITOR, isActive: false });
      expect(args.select.passwordHash).toBeUndefined();
    });

    it('omits filters that are not provided', async () => {
      prisma.user.findMany.mockResolvedValue([]);

      await service.findAll({});

      expect(prisma.user.findMany.mock.calls[0][0].where).toEqual({});
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns the safe user when found', async () => {
      const safe = { id: 'u1', email: 'a@b.c', role: UserRole.AUTHOR };
      prisma.user.findUnique.mockResolvedValue(safe);

      await expect(service.findOne('u1')).resolves.toBe(safe);
    });
  });

  describe('updateRole', () => {
    it('rejects assigning the ADMIN role', async () => {
      await expect(
        service.updateRole('admin-1', 'u2', UserRole.ADMIN),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects modifying your own account', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: UserRole.ADMIN });

      await expect(
        service.updateRole('admin-1', 'admin-1', UserRole.EDITOR),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects modifying another ADMIN account', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'admin-2', role: UserRole.ADMIN });

      await expect(
        service.updateRole('admin-1', 'admin-2', UserRole.EDITOR),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException for an unknown target', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRole('admin-1', 'missing', UserRole.EDITOR),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates the role and bumps tokenVersion to revoke stale tokens', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', role: UserRole.AUTHOR });
      prisma.user.update.mockResolvedValue({ id: 'u2', role: UserRole.EDITOR });

      await service.updateRole('admin-1', 'u2', UserRole.EDITOR);

      const args = prisma.user.update.mock.calls[0][0];
      expect(args.where).toEqual({ id: 'u2' });
      expect(args.data.role).toBe(UserRole.EDITOR);
      expect(args.data.tokenVersion).toEqual({ increment: 1 });
      expect(args.select.passwordHash).toBeUndefined();
    });
  });

  describe('setActive', () => {
    it('rejects deactivating your own account', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: UserRole.ADMIN });

      await expect(service.setActive('admin-1', 'admin-1', false)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects modifying an ADMIN account', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'admin-2', role: UserRole.ADMIN });

      await expect(service.setActive('admin-1', 'admin-2', false)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('bumps tokenVersion when deactivating', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', role: UserRole.AUTHOR });
      prisma.user.update.mockResolvedValue({ id: 'u2', isActive: false });

      await service.setActive('admin-1', 'u2', false);

      const args = prisma.user.update.mock.calls[0][0];
      expect(args.data.isActive).toBe(false);
      expect(args.data.tokenVersion).toEqual({ increment: 1 });
    });

    it('does not bump tokenVersion when reactivating', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u2', role: UserRole.AUTHOR });
      prisma.user.update.mockResolvedValue({ id: 'u2', isActive: true });

      await service.setActive('admin-1', 'u2', true);

      const args = prisma.user.update.mock.calls[0][0];
      expect(args.data.isActive).toBe(true);
      expect(args.data.tokenVersion).toBeUndefined();
    });
  });
});
