import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {}

  get cloudName(): string {
    return this.config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME');
  }

  get apiKey(): string {
    return this.config.getOrThrow<string>('CLOUDINARY_API_KEY');
  }

  sign(paramsToSign: Record<string, string | number>): string {
    return cloudinary.utils.api_sign_request(
      paramsToSign,
      this.config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
    );
  }
}
