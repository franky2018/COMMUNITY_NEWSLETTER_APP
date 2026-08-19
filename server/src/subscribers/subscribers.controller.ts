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
import { UnsubscribeDto } from './dto/unsubscribe.dto';
import type { AuthenticatedUser } from '../auth/types/auth.types';

const SUBSCRIBE_ACK = {
  message: 'If the address is valid, your subscription has been recorded.',
};

@Controller('subscribers')
export class SubscribersController {
  constructor(private readonly subscribers: SubscribersService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(@Body() dto: CreateSubscriberDto) {
    await this.subscribers.create(dto);
    return SUBSCRIBE_ACK;
  }

  @Post('manage')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async createManaged(
    @Body() dto: CreateSubscriberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertManager(user);
    return this.subscribers.createManaged(dto);
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.OK)
  async unsubscribe(@Body() dto: UnsubscribeDto) {
    await this.subscribers.unsubscribeByToken(dto.token);
    return { message: 'You have been unsubscribed.' };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  findAll(
    @Query() query: QuerySubscriberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertManager(user);
    return this.subscribers.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    this.assertManager(user);
    return this.subscribers.findOne(id);
  }

  @Get(':id/unsubscribe-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  async unsubscribeToken(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    this.assertManager(user);
    await this.subscribers.findOne(id);
    return { token: this.subscribers.generateUnsubscribeToken(id) };
  }

  private assertManager(user: AuthenticatedUser) {
    if (user.role === UserRole.AUTHOR) {
      throw new ForbiddenException(
        'AUTHOR users cannot access subscriber management',
      );
    }
  }
}
