export type NestErrorPayload = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

export function readPayloadMessages(payload: unknown): string[] {
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
