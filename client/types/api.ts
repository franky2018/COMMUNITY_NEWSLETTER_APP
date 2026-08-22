export type UserRole = "ADMIN" | "EDITOR" | "AUTHOR";

export type NewsletterStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type SubscriberStatus = "ACTIVE" | "UNSUBSCRIBED";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  tokenVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface NewsletterAuthor {
  id: string;
  name: string;
  role: UserRole;
}

export interface Newsletter {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  featuredImageUrl?: string | null;
  status: NewsletterStatus;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // author fields are returned on authenticated responses; the public list omits them
  authorId?: string;
  author?: NewsletterAuthor;
  categoryId?: string | null;
  category?: CategorySummary | null;
}

export interface Subscriber {
  id: string;
  email: string;
  name?: string | null;
  status: SubscriberStatus;
  subscribedAt: string;
  unsubscribedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export type ManagedSubscriberOutcome = "created" | "reactivated" | "already_active";

export interface ManagedSubscriberResult {
  result: ManagedSubscriberOutcome;
  subscriber: Subscriber;
}

export type UploadType = "avatar" | "newsletter";

// Response from POST /media/signature: everything the browser needs to upload
// directly to Cloudinary. `params` are the exact fields that were signed and
// must be echoed back verbatim alongside api_key/timestamp/signature.
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
