import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateNewsletterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(100000)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  excerpt?: string | null;

  @IsOptional()
  @IsUUID()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  categoryId?: string | null;
}
