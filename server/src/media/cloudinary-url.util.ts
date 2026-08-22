import { BadRequestException } from '@nestjs/common';

export function assertOwnedCloudinaryUrl(url: string, cloudName: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new BadRequestException('Invalid media URL');
  }

  const isOwnedAsset =
    parsed.protocol === 'https:' &&
    parsed.hostname === 'res.cloudinary.com' &&
    parsed.pathname.startsWith(`/${cloudName}/`);

  if (!isOwnedAsset) {
    throw new BadRequestException('Media URL must be a Cloudinary asset URL');
  }
}
