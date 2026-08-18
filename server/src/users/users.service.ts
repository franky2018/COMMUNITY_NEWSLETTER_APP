import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '../../generated/prisma/client';
import { UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import type { User } from '../../generated/prisma/client';

export type SafeUser = Omit<User, 'passwordHash'>;

const SALT_ROUNDS = 12;
const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  tokenVersion: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<SafeUser> {
    if (dto.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot create ADMIN accounts');
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      return await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          passwordHash,
          ...(dto.role ? { role: dto.role } : {}),
        },
        select: safeUserSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email already in use');
      }
      throw error;
    }
  }

  findByEmailWithHash(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<SafeUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
  }

  findAll(query: QueryUserDto): Promise<SafeUser[]> {
    const where: Prisma.UserWhereInput = {};
    if (query.role) {
      where.role = query.role;
    }
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    return this.prisma.user.findMany({
      where,
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateRole(actingUserId: string, id: string, role: UserRole): Promise<SafeUser> {
    if (role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot assign the ADMIN role');
    }
    await this.assertManageableTarget(actingUserId, id);

    // Role is embedded in issued access tokens; bump tokenVersion to revoke stale ones.
    return this.prisma.user.update({
      where: { id },
      data: { role, tokenVersion: { increment: 1 } },
      select: safeUserSelect,
    });
  }

  async setActive(actingUserId: string, id: string, isActive: boolean): Promise<SafeUser> {
    await this.assertManageableTarget(actingUserId, id);

    return this.prisma.user.update({
      where: { id },
      data: {
        isActive,
        // Deactivation revokes existing sessions; reactivation leaves tokens as-is.
        ...(isActive ? {} : { tokenVersion: { increment: 1 } }),
      },
      select: safeUserSelect,
    });
  }

  async incrementTokenVersion(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { tokenVersion: { increment: 1 } },
    });
  }

  private async assertManageableTarget(actingUserId: string, id: string): Promise<void> {
    const target = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (target.id === actingUserId) {
      throw new ForbiddenException('You cannot modify your own account');
    }
    if (target.role === UserRole.ADMIN) {
      throw new ForbiddenException('Admin accounts cannot be modified here');
    }
  }
}
