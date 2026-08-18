import { IsIn } from 'class-validator';
import { UserRole } from '../../../generated/prisma/enums';

export class ChangeRoleDto {
  @IsIn([UserRole.EDITOR, UserRole.AUTHOR])
  role!: UserRole;
}
