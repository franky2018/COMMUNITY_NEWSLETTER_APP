import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { NewsletterStatus } from '../../../generated/prisma/enums';

export class QueryNewsletterDto {
  @IsOptional()
  @IsEnum(NewsletterStatus)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  status?: NewsletterStatus;

  @IsOptional()
  @IsUUID()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  authorId?: string;
}

export class PublicQueryNewsletterDto {
  @IsOptional()
  @IsUUID()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  categoryId?: string;
}
