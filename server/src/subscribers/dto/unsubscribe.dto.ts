import { IsString, MaxLength, MinLength } from 'class-validator';

export class UnsubscribeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  token!: string;
}
