import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../../generated/prisma/enums';

export class QueryUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  role?: UserRole;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}
