import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../../generated/prisma/enums';
import { SubscribersService } from './subscribers.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { QuerySubscriberDto } from './dto/query-subscriber.dto';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@Controller('subscribers')
export class SubscribersController {
  constructor(private readonly subscribers: SubscribersService) {}

  /**
   * POST /subscribers
   * Public endpoint - create a new subscriber
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSubscriberDto) {
    return this.subscribers.create(dto);
  }

  /**
   * POST /subscribers/:id/unsubscribe
   * Public endpoint - unsubscribe a subscriber
   */
  @Post(':id/unsubscribe')
  @HttpCode(HttpStatus.OK)
  unsubscribe(@Param('id') id: string) {
    return this.subscribers.unsubscribe(id);
  }

  /**
   * GET /subscribers
   * ADMIN and EDITOR only - list all subscribers
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  findAll(
    @Query() query: QuerySubscriberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Additional check: 403 for AUTHOR
    if (user.role === UserRole.AUTHOR) {
      throw new ForbiddenException(
        'AUTHOR users cannot access subscriber management',
      );
    }
    return this.subscribers.findAll(query);
  }

  /**
   * GET /subscribers/:id
   * ADMIN and EDITOR only - get a single subscriber
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // Additional check: 403 for AUTHOR
    if (user.role === UserRole.AUTHOR) {
      throw new ForbiddenException(
        'AUTHOR users cannot access subscriber management',
      );
    }
    return this.subscribers.findOne(id);
  }
}
