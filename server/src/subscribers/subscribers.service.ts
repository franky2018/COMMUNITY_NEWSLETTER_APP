import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

@Injectable()
export class SubscribersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateSubscriberDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const trimmedName = dto.name?.trim() || null;

    // Check if subscriber already exists
    const existing = await this.prisma.subscriber.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, status: true, subscribedAt: true },
    });

    // If ACTIVE, return conflict
    if (existing && existing.status === SubscriberStatus.ACTIVE) {
      throw new ConflictException(
        'Subscriber with this email already exists and is active',
      );
    }

    // If UNSUBSCRIBED, reactivate
    if (existing && existing.status === SubscriberStatus.UNSUBSCRIBED) {
      return await this.prisma.subscriber.update({
        where: { id: existing.id },
        data: {
          status: SubscriberStatus.ACTIVE,
          subscribedAt: new Date(),
          unsubscribedAt: null,
        },
        select: subscriberSelect,
      });
    }

    // Create new subscriber
    try {
      return await this.prisma.subscriber.create({
        data: {
          email: normalizedEmail,
          name: trimmedName,
          status: SubscriberStatus.ACTIVE,
          subscribedAt: new Date(),
        },
        select: subscriberSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          'Subscriber with this email already exists',
        );
      }
      throw error;
    }
  }

  async unsubscribe(id: string) {
    const existing = await this.prisma.subscriber.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Subscriber not found');
    }

    // If already unsubscribed, return current state
    if (existing.status === SubscriberStatus.UNSUBSCRIBED) {
      return await this.prisma.subscriber.findUnique({
        where: { id },
        select: subscriberSelect,
      });
    }

    // Unsubscribe
    return await this.prisma.subscriber.update({
      where: { id },
      data: {
        status: SubscriberStatus.UNSUBSCRIBED,
        unsubscribedAt: new Date(),
      },
      select: subscriberSelect,
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
}
