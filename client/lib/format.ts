type FormatDateOptions = {
  fallback?: string;
  month?: "short" | "long";
  withTime?: boolean;
};

export function formatDate(value?: string | null, options: FormatDateOptions = {}): string {
  const { fallback = "—", month = "short", withTime = false } = options;

  if (!value) {
    return fallback;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  if (withTime) {
    return date.toLocaleString();
  }

  return date.toLocaleDateString(undefined, { year: "numeric", month, day: "numeric" });
}
