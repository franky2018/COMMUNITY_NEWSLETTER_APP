import { ApiError } from "@/lib/api/client";
import { readPayloadMessages } from "@/lib/api/errors";

export function getSubscribeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return "You're already subscribed with this email address.";
    }

    if (error.status === 400) {
      const messages = readPayloadMessages(error.payload);

      if (messages.length > 0) {
        return messages.join(" ");
      }

      return "Please check your details and try again.";
    }

    if (error.status >= 500) {
      return "Something went wrong on our end. Please try again in a moment.";
    }
  }

  return fallback;
}
