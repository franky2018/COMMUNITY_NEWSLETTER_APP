import { IsEnum, IsOptional } from 'class-validator';
import { SubscriberStatus } from '../../../generated/prisma/enums';

export class QuerySubscriberDto {
  @IsOptional()
  @IsEnum(SubscriberStatus)
  status?: SubscriberStatus;
}
