import Image from "next/image";

type AvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
};

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Avatar({ name, avatarUrl, size = 40, className }: AvatarProps) {
  const dimension = { width: size, height: size };
  const base =
    "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary";
  const classes = className ? `${base} ${className}` : base;

  if (avatarUrl) {
    return (
      <span className={classes} style={dimension}>
        <Image
          src={avatarUrl}
          alt={`${name} avatar`}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={`${classes} font-medium text-on-primary`}
      style={{ ...dimension, fontSize: Math.max(11, Math.round(size * 0.4)) }}
      aria-hidden="true"
    >
      {initialsFrom(name)}
    </span>
  );
}
