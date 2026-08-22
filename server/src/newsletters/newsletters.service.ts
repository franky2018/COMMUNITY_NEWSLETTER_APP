import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../../generated/prisma/client';
import { NewsletterStatus, UserRole } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { assertOwnedCloudinaryUrl } from '../media/cloudinary-url.util';
import { SubscribersService } from '../subscribers/subscribers.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import {
  PublicQueryNewsletterDto,
  QueryNewsletterDto,
} from './dto/query-newsletter.dto';
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
  featuredImageUrl: true,
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
  private readonly logger = new Logger(NewslettersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly subscribers: SubscribersService,
    private readonly config: ConfigService,
  ) {}

  private resolveFeaturedImageUrl(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }
    assertOwnedCloudinaryUrl(
      value,
      this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
    );
    return value;
  }

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
          featuredImageUrl: this.resolveFeaturedImageUrl(dto.featuredImageUrl),
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
        throw new ForbiddenException(
          "Authors cannot view another author's newsletters",
        );
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
        featuredImageUrl: true,
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

    if (
      user.role === UserRole.AUTHOR &&
      newsletter.status === NewsletterStatus.DRAFT &&
      newsletter.authorId !== user.id
    ) {
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

    if (
      user.role === UserRole.AUTHOR &&
      current.status !== NewsletterStatus.DRAFT
    ) {
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

    const nextTitle =
      dto.title !== undefined ? dto.title.trim() : current.title;
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

    if (dto.featuredImageUrl !== undefined) {
      updateData.featuredImageUrl = this.resolveFeaturedImageUrl(
        dto.featuredImageUrl,
      );
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
      const published = await this.prisma.newsletter.update({
        where: { id },
        data: {
          status: NewsletterStatus.PUBLISHED,
          publishedAt: new Date(),
        },
        select: newsletterSelect,
      });

      // First successful publish only. Re-publishing hits the PUBLISHED branch
      // below and edits go through update(), so notifications fire exactly once.
      // Dispatch is fire-and-forget: publication is already committed and an
      // email failure must never roll it back or delay the response.
      void this.dispatchPublishNotifications(published);

      return published;
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

  private async dispatchPublishNotifications(
    newsletter: Prisma.NewsletterGetPayload<{ select: typeof newsletterSelect }>,
  ): Promise<void> {
    try {
      const recipients = await this.subscribers.findActiveRecipients();
      if (recipients.length === 0) {
        return;
      }

      const summary = await this.mail.sendNewsletterPublishedEmails(
        {
          title: newsletter.title,
          slug: newsletter.slug,
          excerpt: newsletter.excerpt,
          categoryName: newsletter.category?.name ?? null,
          publishedAt: newsletter.publishedAt,
        },
        recipients,
      );

      this.logger.log(
        `Newsletter ${newsletter.id} publish notifications — sent: ${summary.sent}, failed: ${summary.failed}, skipped: ${summary.skipped}, total: ${summary.total}`,
      );
    } catch (error) {
      // Publication is already committed; surface nothing to the client and
      // never log recipient addresses.
      this.logger.error(
        `Newsletter ${newsletter.id} publish notifications failed to dispatch: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
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
