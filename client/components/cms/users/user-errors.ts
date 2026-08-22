import { ApiError } from "@/lib/api/client";
import { readPayloadMessages } from "@/lib/api/errors";

export function getUserErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    // Never surface internal 5xx details; use the caller's friendly fallback.
    if (error.status >= 500) {
      return fallback;
    }

    const messages = readPayloadMessages(error.payload);
    if (messages.length > 0) {
      return messages.join(" ");
    }

    if (error.status === 401) {
      return "Your session has expired. Please sign in again.";
    }
    if (error.status === 403) {
      return "You do not have permission to perform this action.";
    }
    if (error.status === 404) {
      return "This user could not be found.";
    }
    if (error.status === 409) {
      return "A user with this email address already exists.";
    }
  }

  return fallback;
}
