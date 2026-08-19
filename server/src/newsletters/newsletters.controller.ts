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
import { UserRole } from '../../generated/prisma/enums';
import { NewslettersService } from './newsletters.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import {
  PublicQueryNewsletterDto,
  QueryNewsletterDto,
} from './dto/query-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@Controller('newsletters')
export class NewslettersController {
  constructor(private readonly newsletters: NewslettersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateNewsletterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.newsletters.create(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryNewsletterDto,
  ) {
    return this.newsletters.findAll(user, query);
  }

  @Get('public')
  findPublic(@Query() query: PublicQueryNewsletterDto) {
    return this.newsletters.findPublic(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.newsletters.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNewsletterDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.newsletters.update(id, dto, user);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  publish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.newsletters.publish(id, user);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @HttpCode(HttpStatus.OK)
  archive(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.newsletters.archive(id, user);
  }
}
