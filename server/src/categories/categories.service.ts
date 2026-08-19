import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const name = dto.name.trim();
    const slug = await this.generateUniqueSlug(name);

    try {
      return await this.prisma.category.create({
        data: {
          name,
          slug,
          description: dto.description?.trim() || null,
        },
        select: categorySelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Category name or slug already exists');
      }
      throw error;
    }
  }

  findAll() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: categorySelect,
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: categorySelect,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const current = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true },
    });

    if (!current) {
      throw new NotFoundException('Category not found');
    }

    const nextName = dto.name !== undefined ? dto.name.trim() : current.name;
    const nextDescription =
      dto.description !== undefined
        ? dto.description?.trim() || null
        : undefined;
    const shouldUpdateSlug =
      dto.name !== undefined && dto.name.trim() !== current.name;
    const nextSlug = shouldUpdateSlug
      ? await this.generateUniqueSlug(nextName, id)
      : current.slug;

    try {
      return await this.prisma.category.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: nextName } : {}),
          ...(shouldUpdateSlug ? { slug: nextSlug } : {}),
          ...(dto.description !== undefined
            ? { description: nextDescription }
            : {}),
        },
        select: categorySelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Category name or slug already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    await this.prisma.category.delete({ where: { id } });
  }

  private async generateUniqueSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const baseSlug = this.slugify(name);
    let attempt = baseSlug || 'category';
    let counter = 1;

    while (true) {
      const existing = await this.prisma.category.findUnique({
        where: { slug: attempt },
        select: { id: true },
      });

      if (!existing || (excludeId && existing.id === excludeId)) {
        return attempt;
      }

      attempt = `${baseSlug}-${counter}`;
      counter += 1;
    }
  }

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
