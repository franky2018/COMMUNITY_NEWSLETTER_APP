import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '../../generated/prisma/client';
import { UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { assertOwnedCloudinaryUrl } from '../media/cloudinary-url.util';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import type { User } from '../../generated/prisma/client';

export type SafeUser = Omit<
  User,
  | 'passwordHash'
  | 'passwordResetTokenHash'
  | 'passwordResetExpiresAt'
  | 'emailVerificationTokenHash'
  | 'emailVerificationExpiresAt'
>;

const SALT_ROUNDS = 12;
const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  role: true,
  isActive: true,
  tokenVersion: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

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
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already in use');
      }
      throw error;
    }
  }

  findByEmailWithHash(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByIdWithHash(
    id: string,
  ): Promise<{ id: string; passwordHash: string } | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, passwordHash: true },
    });
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

    async updateProfile(
    userId: string,
    data: { name?: string; avatarUrl?: string | null },
  ): Promise<SafeUser> {
    const updateData: Prisma.UserUpdateInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name.trim();
    }

    if (data.avatarUrl !== undefined) {
      if (data.avatarUrl) {
        assertOwnedCloudinaryUrl(
          data.avatarUrl,
          this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
        );
        updateData.avatarUrl = data.avatarUrl;
      } else {
        updateData.avatarUrl = null;
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: safeUserSelect,
    });
  }

  async updateRole(
    actingUserId: string,
    id: string,
    role: UserRole,
  ): Promise<SafeUser> {
    if (role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot assign the ADMIN role');
    }
    await this.assertManageableTarget(actingUserId, id);

    return this.prisma.user.update({
      where: { id },
      data: { role, tokenVersion: { increment: 1 } },
      select: safeUserSelect,
    });
  }

  async setActive(
    actingUserId: string,
    id: string,
    isActive: boolean,
  ): Promise<SafeUser> {
    await this.assertManageableTarget(actingUserId, id);

    return this.prisma.user.update({
      where: { id },
      data: {
        isActive,
        ...(isActive ? {} : { tokenVersion: { increment: 1 } }),
      },
      select: safeUserSelect,
    });
  }

  async incrementTokenVersion(id: string): Promise<SafeUser> {
    return this.prisma.user.update({
      where: { id },
      data: { tokenVersion: { increment: 1 } },
      select: safeUserSelect,
    });
  }

  findByEmailForReset(
    email: string,
  ): Promise<{ id: string; email: string; isActive: boolean } | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, isActive: true },
    });
  }

  async setPasswordResetToken(
    id: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
      select: { id: true },
    });
  }

  findByActiveResetTokenHash(
    tokenHash: string,
  ): Promise<{ id: string } | null> {
    return this.prisma.user.findFirst({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
  }

  async completePasswordReset(
    tokenHash: string,
    newPassword: string,
  ): Promise<number> {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const result = await this.prisma.user.updateMany({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: { gt: new Date() },
      },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        tokenVersion: { increment: 1 },
      },
    });
    return result.count;
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash, tokenVersion: { increment: 1 } },
      select: { id: true },
    });
  }

  async setEmailVerificationToken(
    id: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: expiresAt,
      },
      select: { id: true },
    });
  }

  async completeEmailVerification(tokenHash: string): Promise<number> {
    const result = await this.prisma.user.updateMany({
      where: {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: { gt: new Date() },
      },
      data: {
        emailVerified: true,
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
    });
    return result.count;
  }

  private async assertManageableTarget(
    actingUserId: string,
    id: string,
  ): Promise<void> {
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
