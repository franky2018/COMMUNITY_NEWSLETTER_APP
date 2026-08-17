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

export function getCategoryErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "You do not have permission to perform this action.";
    }

    const messages = readPayloadMessages(error.payload);

    if (messages.length > 0) {
      return messages.join(" ");
    }

    if (error.status === 409) {
      return "A category with that name already exists.";
    }
  }

  return fallback;
}
