import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from './cloudinary.service';

export type UploadType = 'avatar' | 'newsletter';

export interface MediaLibraryAsset {
  id: string;
  url: string;
  type: UploadType;
  createdAt: string;
  filename?: string;
}

export interface UploadPolicy {
  folder: string;
  resourceType: 'image';
  maxBytes: number;
  allowedFormats: string[];
  allowedMimeTypes: string[];
}

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  params: Record<string, string>;
  resourceType: string;
  maxBytes: number;
  allowedFormats: string[];
  allowedMimeTypes: string[];
}

const MB = 1024 * 1024;

const IMAGE_FORMATS = ['jpg', 'png', 'webp'];
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const UPLOAD_POLICIES: Record<UploadType, UploadPolicy> = {
  avatar: {
    folder: 'community-newsletter/avatars',
    resourceType: 'image',
    maxBytes: 5 * MB,
    allowedFormats: IMAGE_FORMATS,
    allowedMimeTypes: IMAGE_MIME_TYPES,
  },
  newsletter: {
    folder: 'community-newsletter/newsletters',
    resourceType: 'image',
    maxBytes: 10 * MB,
    allowedFormats: IMAGE_FORMATS,
    allowedMimeTypes: IMAGE_MIME_TYPES,
  },
};

@Injectable()
export class MediaService {
  constructor(
    private readonly cloudinary: CloudinaryService,
    private readonly prisma: PrismaService,
  ) {}

  createSignature(uploadType: UploadType): UploadSignature {
    const policy = UPLOAD_POLICIES[uploadType];
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = this.cloudinary.sign({
      folder: policy.folder,
      timestamp,
    });

    return {
      cloudName: this.cloudinary.cloudName,
      apiKey: this.cloudinary.apiKey,
      timestamp,
      signature,
      params: { folder: policy.folder },
      resourceType: policy.resourceType,
      maxBytes: policy.maxBytes,
      allowedFormats: policy.allowedFormats,
      allowedMimeTypes: policy.allowedMimeTypes,
    };
  }

  // The media library is derived from the Cloudinary URLs already persisted on
  // newsletters and user avatars — uploads still flow through /media/signature,
  // so there is no separate asset store to keep in sync.
  async listLibrary(): Promise<MediaLibraryAsset[]> {
    const [newsletters, users] = await Promise.all([
      this.prisma.newsletter.findMany({
        where: { featuredImageUrl: { not: null } },
        select: { id: true, featuredImageUrl: true, createdAt: true },
      }),
      this.prisma.user.findMany({
        where: { avatarUrl: { not: null } },
        select: { id: true, avatarUrl: true, createdAt: true },
      }),
    ]);

    const assets: MediaLibraryAsset[] = [
      ...newsletters.map((n) => ({
        id: n.id,
        url: n.featuredImageUrl as string,
        type: 'newsletter' as const,
        createdAt: n.createdAt.toISOString(),
        filename: this.filenameFromUrl(n.featuredImageUrl as string),
      })),
      ...users.map((u) => ({
        id: u.id,
        url: u.avatarUrl as string,
        type: 'avatar' as const,
        createdAt: u.createdAt.toISOString(),
        filename: this.filenameFromUrl(u.avatarUrl as string),
      })),
    ];

    return assets.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private filenameFromUrl(url: string): string | undefined {
    const path = url.split('?')[0];
    const last = path.split('/').pop();
    return last || undefined;
  }
}
