import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import type { User } from '../../generated/prisma/client';

export type SafeUser = Omit<User, 'passwordHash'>;

const SALT_ROUNDS = 12;
const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<SafeUser> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        ...(dto.role ? { role: dto.role } : {}),
      },
      select: safeUserSelect,
    });
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
}
