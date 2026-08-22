import { ApiError } from "@/lib/api/client";
import { readPayloadMessages } from "@/lib/api/errors";

export function getSubscriberErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "You do not have permission to perform this action.";
    }

    const messages = readPayloadMessages(error.payload);

    if (messages.length > 0) {
      return messages.join(" ");
    }

    if (error.status === 409) {
      return "A subscriber with this email address is already active.";
    }
  }

  return fallback;
}
