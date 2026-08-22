import { IsIn } from 'class-validator';
import type { UploadType } from '../media.service';

export class CreateUploadSignatureDto {
  @IsIn(['avatar', 'newsletter'])
  uploadType!: UploadType;
}
