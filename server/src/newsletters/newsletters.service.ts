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
import { PublicQueryNewsletterDto, QueryNewsletterDto } from './dto/query-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import type { AuthenticatedUser } from '../auth/types/auth.types';

const safeAuthorSelect = {
  id: true,
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

  async findAll(user: AuthenticatedUser, filters?: QueryNewsletterDto) {
    const where: Prisma.NewsletterWhereInput = {};

    if (user.role === UserRole.AUTHOR) {
      where.authorId = user.id;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.authorId) {
      if (user.role === UserRole.AUTHOR && filters.authorId !== user.id) {
        throw new ForbiddenException('Authors cannot view another author\'s newsletters');
      }

      where.authorId = filters.authorId;
    }

    return this.prisma.newsletter.findMany({
      where,
      select: newsletterSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPublic(filters?: PublicQueryNewsletterDto) {
    const where: Prisma.NewsletterWhereInput = {
      status: NewsletterStatus.PUBLISHED,
    };

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    return this.prisma.newsletter.findMany({
      where,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        categoryId: true,
        category: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { publishedAt: 'desc' },
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

    if (user.role === UserRole.AUTHOR && newsletter.authorId !== user.id) {
      throw new ForbiddenException('You can only view your own newsletters');
    }

    if (user.role === UserRole.AUTHOR && newsletter.status === NewsletterStatus.DRAFT && newsletter.authorId !== user.id) {
      throw new ForbiddenException('You do not have access to this newsletter');
    }

    return newsletter;
  }

  async update(id: string, dto: UpdateNewsletterDto, user: AuthenticatedUser) {
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

    if (user.role === UserRole.AUTHOR && current.authorId !== user.id) {
      throw new ForbiddenException('You can only update your own newsletters');
    }

    if (user.role === UserRole.AUTHOR && current.status !== NewsletterStatus.DRAFT) {
      throw new ForbiddenException('Authors can only update their own drafts');
    }

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
    const shouldUpdateSlug = dto.title !== undefined && dto.title.trim() !== current.title;
    const nextSlug = shouldUpdateSlug ? await this.generateUniqueSlug(nextTitle, id) : current.slug;

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
      },
    });

    if (!newsletter) {
      throw new NotFoundException('Newsletter not found');
    }

    if (user.role === UserRole.AUTHOR) {
      throw new ForbiddenException('Authors cannot publish newsletters');
    }

    if (newsletter.status === NewsletterStatus.DRAFT) {
      return this.prisma.newsletter.update({
        where: { id },
        data: {
          status: NewsletterStatus.PUBLISHED,
          publishedAt: new Date(),
        },
        select: newsletterSelect,
      });
    }

    if (newsletter.status === NewsletterStatus.PUBLISHED) {
      return this.prisma.newsletter.update({
        where: { id },
        data: {
          publishedAt: new Date(),
        },
        select: newsletterSelect,
      });
    }

    throw new BadRequestException('Archived newsletters cannot be republished');
  }

  async archive(id: string, user: AuthenticatedUser) {
    const newsletter = await this.prisma.newsletter.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
      },
    });

    if (!newsletter) {
      throw new NotFoundException('Newsletter not found');
    }

    if (user.role === UserRole.AUTHOR) {
      throw new ForbiddenException('Authors cannot archive newsletters');
    }

    if (newsletter.status === NewsletterStatus.ARCHIVED) {
      throw new BadRequestException('Newsletter is already archived');
    }

    return this.prisma.newsletter.update({
      where: { id },
      data: {
        status: NewsletterStatus.ARCHIVED,
        publishedAt: null,
      },
      select: newsletterSelect,
    });
  }

  private async generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
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
