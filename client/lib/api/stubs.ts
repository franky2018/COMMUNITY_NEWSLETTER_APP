import { apiClient } from "@/lib/api/client";
import type { UploadType } from "@/types/api";

// Thin wrappers over the backend endpoints behind the CMS, profile, and public
// unsubscribe/verify flows. Signatures and return types are kept stable so the
// existing callers need no changes.

export type MediaAsset = {
  id: string;
  url: string;
  type: UploadType;
  createdAt: string;
  filename?: string;
};

// GET /media — persisted Cloudinary uploads (newsletter images + avatars),
// newest first.
export async function listMedia(): Promise<MediaAsset[]> {
  return apiClient.get<MediaAsset[]>("/media", { requiresAuth: true });
}

export type UnsubscribeState = "success" | "invalid" | "expired";

// POST /subscribers/unsubscribe { token } (public). A rejected request means an
// invalid or already-used token; the caller maps the thrown error to "invalid".
export async function unsubscribeByToken(token: string): Promise<UnsubscribeState> {
  await apiClient.post("/subscribers/unsubscribe", { token });
  return "success";
}

// PATCH /auth/me { name } — extends the existing profile endpoint.
export async function updateProfileName(name: string): Promise<void> {
  await apiClient.patch("/auth/me", { name }, { requiresAuth: true });
}

// POST /auth/change-password { currentPassword, newPassword }.
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await apiClient.post(
    "/auth/change-password",
    { currentPassword, newPassword },
    { requiresAuth: true },
  );
}

export type VerifyEmailState = "success" | "invalid";

// POST /auth/verify-email { token } (public). An invalid/expired token resolves
// to "invalid" rather than throwing, matching the caller's contract.
export async function verifyEmail(token: string): Promise<VerifyEmailState> {
  try {
    await apiClient.post("/auth/verify-email", { token });
    return "success";
  } catch {
    return "invalid";
  }
}

// POST /auth/resend-verification (authenticated).
export async function resendVerification(): Promise<void> {
  await apiClient.post("/auth/resend-verification", undefined, {
    requiresAuth: true,
  });
}
