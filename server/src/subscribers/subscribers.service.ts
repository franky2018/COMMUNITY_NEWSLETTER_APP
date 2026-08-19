import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriberStatus } from '../../generated/prisma/enums';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { QuerySubscriberDto } from './dto/query-subscriber.dto';

const subscriberSelect = {
  id: true,
  email: true,
  name: true,
  status: true,
  subscribedAt: true,
  unsubscribedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export type ManagedSubscriberOutcome =
  'created' | 'reactivated' | 'already_active';

export type ManagedSubscriberResult = {
  result: ManagedSubscriberOutcome;
  subscriber: Prisma.SubscriberGetPayload<{ select: typeof subscriberSelect }>;
};

@Injectable()
export class SubscribersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(dto: CreateSubscriberDto): Promise<void> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const trimmedName = dto.name?.trim() || null;

    const existing = await this.prisma.subscriber.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, status: true },
    });

    if (existing) {
      if (existing.status === SubscriberStatus.UNSUBSCRIBED) {
        await this.prisma.subscriber.update({
          where: { id: existing.id },
          data: {
            status: SubscriberStatus.ACTIVE,
            subscribedAt: new Date(),
            unsubscribedAt: null,
          },
        });
      }
      return;
    }

    try {
      await this.prisma.subscriber.create({
        data: {
          email: normalizedEmail,
          name: trimmedName,
          status: SubscriberStatus.ACTIVE,
          subscribedAt: new Date(),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return;
      }
      throw error;
    }
  }

  async createManaged(
    dto: CreateSubscriberDto,
  ): Promise<ManagedSubscriberResult> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const trimmedName = dto.name?.trim() || null;

    const existing = await this.prisma.subscriber.findUnique({
      where: { email: normalizedEmail },
      select: subscriberSelect,
    });

    if (existing) {
      if (existing.status === SubscriberStatus.UNSUBSCRIBED) {
        const subscriber = await this.prisma.subscriber.update({
          where: { id: existing.id },
          data: {
            status: SubscriberStatus.ACTIVE,
            subscribedAt: new Date(),
            unsubscribedAt: null,
          },
          select: subscriberSelect,
        });
        return { result: 'reactivated', subscriber };
      }
      return { result: 'already_active', subscriber: existing };
    }

    try {
      const subscriber = await this.prisma.subscriber.create({
        data: {
          email: normalizedEmail,
          name: trimmedName,
          status: SubscriberStatus.ACTIVE,
          subscribedAt: new Date(),
        },
        select: subscriberSelect,
      });
      return { result: 'created', subscriber };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // A concurrent insert won the race; report the current active record.
        const subscriber = await this.prisma.subscriber.findUniqueOrThrow({
          where: { email: normalizedEmail },
          select: subscriberSelect,
        });
        return { result: 'already_active', subscriber };
      }
      throw error;
    }
  }

  generateUnsubscribeToken(id: string): string {
    return `${id}.${this.sign(id)}`;
  }

  async unsubscribeByToken(token: string): Promise<void> {
    const separator = token.lastIndexOf('.');
    if (separator <= 0) {
      throw new BadRequestException('Invalid unsubscribe token');
    }

    const id = token.slice(0, separator);
    const signature = token.slice(separator + 1);
    if (!this.verify(id, signature)) {
      throw new BadRequestException('Invalid unsubscribe token');
    }

    await this.prisma.subscriber.updateMany({
      where: { id, status: SubscriberStatus.ACTIVE },
      data: {
        status: SubscriberStatus.UNSUBSCRIBED,
        unsubscribedAt: new Date(),
      },
    });
  }

  async findAll(query: QuerySubscriberDto) {
    const where: Prisma.SubscriberWhereInput = {};
    if (query.status) {
      where.status = query.status;
    }

    return await this.prisma.subscriber.findMany({
      where,
      select: subscriberSelect,
      orderBy: { subscribedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const subscriber = await this.prisma.subscriber.findUnique({
      where: { id },
      select: subscriberSelect,
    });

    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }

    return subscriber;
  }

  private sign(value: string): string {
    return createHmac('sha256', this.unsubscribeSecret())
      .update(`unsubscribe:${value}`)
      .digest('hex');
  }

  private verify(value: string, signature: string): boolean {
    const expected = Buffer.from(this.sign(value));
    const provided = Buffer.from(signature);
    if (expected.length !== provided.length) {
      return false;
    }
    return timingSafeEqual(expected, provided);
  }

  private unsubscribeSecret(): string {
    return this.config.getOrThrow<string>('UNSUBSCRIBE_SECRET');
  }
}
