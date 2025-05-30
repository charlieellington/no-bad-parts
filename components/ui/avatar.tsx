import * as React from "react";
import { cn } from "@/utils/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
  size?: number; // px, default 32
}

export function Avatar({ src, alt = "", fallback, className, size = 32, ...props }: AvatarProps) {
  const dimension = `${size}px`;
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full bg-muted text-foreground/80 items-center justify-center font-medium",
        className,
      )}
      style={{ width: dimension, height: dimension }}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="object-cover w-full h-full" />
      ) : (
        fallback
      )}
    </span>
  );
} 