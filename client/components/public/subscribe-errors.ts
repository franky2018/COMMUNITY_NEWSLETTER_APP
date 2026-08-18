import { ApiError } from "@/lib/api/client";

type NestErrorPayload = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

function readPayloadMessages(payload: unknown): string[] {
  if (payload && typeof payload === "object") {
    const message = (payload as NestErrorPayload).message;

    if (Array.isArray(message)) {
      return message.filter((entry): entry is string => typeof entry === "string");
    }

    if (typeof message === "string") {
      return [message];
    }
  }

  return [];
}

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
