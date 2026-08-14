import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole, NewsletterStatus } from '../../generated/prisma/enums';
import { NewslettersService } from './newsletters.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@Controller('newsletters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NewslettersController {
  constructor(private readonly newsletters: NewslettersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateNewsletterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.newsletters.create(dto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const filters: {
      status?: NewsletterStatus;
      categoryId?: string;
    } = {};
    if (status && Object.values(NewsletterStatus).includes(status as NewsletterStatus)) {
      filters.status = status as NewsletterStatus;
    }
    if (categoryId) filters.categoryId = categoryId;
    return this.newsletters.findAll(user, filters);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.newsletters.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNewsletterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.newsletters.update(id, dto, user);
  }

  @Post(':id/publish')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  publish(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.newsletters.publish(id, user);
  }

  @Post(':id/archive')
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  archive(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.newsletters.archive(id, user);
  }
}
