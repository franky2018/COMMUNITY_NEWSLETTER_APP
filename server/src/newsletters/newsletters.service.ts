import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { NewsletterStatus, UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import type { AuthenticatedUser } from '../auth/types/auth.types';

const safeAuthorSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
} as const;

const newsletterSelect = {
  id: true,
  title: true,
  slug: true,
  content: true,
  excerpt: true,
  status: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
  author: { select: safeAuthorSelect },
  categoryId: true,
  category: { select: { id: true, name: true, slug: true } },
} as const;

@Injectable()
export class NewslettersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNewsletterDto, user: AuthenticatedUser) {
    const title = dto.title.trim();
    const slug = await this.generateUniqueSlug(title);

    // Validate categoryId if provided
    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
        select: { id: true },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    try {
      return await this.prisma.newsletter.create({
        data: {
          title,
          slug,
          content: dto.content.trim(),
          excerpt: dto.excerpt ? dto.excerpt.trim() : null,
          status: NewsletterStatus.DRAFT,
          authorId: user.id,
          categoryId: dto.categoryId || null,
        },
        select: newsletterSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Newsletter slug already exists');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Invalid author or category');
        }
      }
      throw error;
    }
  }

  async findAll(
    user: AuthenticatedUser,
    filters?: { status?: NewsletterStatus; categoryId?: string },
  ) {
    const where: Prisma.NewsletterWhereInput = {};

    // Apply ownership filter for AUTHOR role
    if (user.role === UserRole.AUTHOR) {
      where.authorId = user.id;
    }

    // Apply status filter if provided
    if (filters?.status) {
      where.status = filters.status;
    }

    // Apply category filter if provided
    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    return await this.prisma.newsletter.findMany({
      where,
      select: newsletterSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const newsletter = await this.prisma.newsletter.findUnique({
      where: { id },
      select: newsletterSelect,
    });

    if (!newsletter) {
      throw new NotFoundException('Newsletter not found');
    }

    // Check ownership for AUTHOR role
    if (user.role === UserRole.AUTHOR && newsletter.authorId !== user.id) {
      throw new ForbiddenException('You can only view your own newsletters');
    }

    return newsletter;
  }

  async update(
    id: string,
    dto: UpdateNewsletterDto,
    user: AuthenticatedUser,
  ) {
    const current = await this.prisma.newsletter.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        authorId: true,
      },
    });

    if (!current) {
      throw new NotFoundException('Newsletter not found');
    }

    // Check ownership for AUTHOR role
    if (user.role === UserRole.AUTHOR && current.authorId !== user.id) {
      throw new ForbiddenException('You can only update your own newsletters');
    }

    // Validate categoryId if provided
    if (dto.categoryId !== undefined && dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
        select: { id: true },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    const nextTitle = dto.title !== undefined ? dto.title.trim() : current.title;
    const shouldUpdateSlug =
      dto.title !== undefined && dto.title.trim() !== current.title;
    const nextSlug = shouldUpdateSlug
      ? await this.generateUniqueSlug(nextTitle, id)
      : current.slug;

    const updateData: Prisma.NewsletterUpdateInput = {};

    if (dto.title !== undefined) {
      updateData.title = nextTitle;
    }
    if (shouldUpdateSlug) {
      updateData.slug = nextSlug;
    }
    if (dto.content !== undefined) {
      updateData.content = dto.content.trim();
    }
    if (dto.excerpt !== undefined) {
      updateData.excerpt = dto.excerpt ? dto.excerpt.trim() : null;
    }
    if (dto.categoryId !== undefined) {
      if (dto.categoryId) {
        updateData.category = { connect: { id: dto.categoryId } };
      } else {
        updateData.category = { disconnect: true };
      }
    }

    try {
      return await this.prisma.newsletter.update({
        where: { id },
        data: updateData,
        select: newsletterSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Newsletter slug already exists');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('Newsletter or category not found');
        }
      }
      throw error;
    }
  }

  async publish(id: string, user: AuthenticatedUser) {
    const newsletter = await this.prisma.newsletter.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        authorId: true,
      },
    });

    if (!newsletter) {
      throw new NotFoundException('Newsletter not found');
    }

    // Only ADMIN and EDITOR can publish
    if (user.role === UserRole.AUTHOR) {
      throw new ForbiddenException('Authors cannot publish newsletters');
    }

    // Validate status transition
    if (newsletter.status !== NewsletterStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot publish newsletter with status ${newsletter.status}`,
      );
    }

    try {
      return await this.prisma.newsletter.update({
        where: { id },
        data: {
          status: NewsletterStatus.PUBLISHED,
          publishedAt: new Date(),
        },
        select: newsletterSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Newsletter not found');
        }
      }
      throw error;
    }
  }

  async archive(id: string, user: AuthenticatedUser) {
    const newsletter = await this.prisma.newsletter.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        authorId: true,
      },
    });

    if (!newsletter) {
      throw new NotFoundException('Newsletter not found');
    }

    // Only ADMIN and EDITOR can archive
    if (user.role === UserRole.AUTHOR) {
      throw new ForbiddenException('Authors cannot archive newsletters');
    }

    // Validate status transition
    if (newsletter.status === NewsletterStatus.ARCHIVED) {
      throw new BadRequestException('Newsletter is already archived');
    }

    try {
      return await this.prisma.newsletter.update({
        where: { id },
        data: {
          status: NewsletterStatus.ARCHIVED,
        },
        select: newsletterSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Newsletter not found');
        }
      }
      throw error;
    }
  }

  private async generateUniqueSlug(
    title: string,
    excludeId?: string,
  ): Promise<string> {
    const baseSlug = this.slugify(title);
    let attempt = baseSlug || 'newsletter';
    let counter = 1;

    while (true) {
      const existing = await this.prisma.newsletter.findUnique({
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
