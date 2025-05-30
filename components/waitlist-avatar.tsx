import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { colorForString } from "@/utils/avatar-colors";
import { getAnimalAvatarUrl } from "@/utils/animal-avatar";

interface WaitlistAvatarProps {
  name: string;
  avatarUrl: string | null;
  hidden?: boolean;
  size?: number;
}

export function WaitlistAvatar({ name, avatarUrl, hidden = false, size = 32 }: WaitlistAvatarProps) {
  // If avatarUrl present use it directly
  let src: string | null = avatarUrl ?? null;
  let fallbackElem: React.ReactNode = null;

  if (!src) {
    if (hidden && name.startsWith("Anon ")) {
      const animal = name.replace(/^Anon\s+/i, "").trim();
      src = getAnimalAvatarUrl(animal, size);
    } else {
      const first = name.trim().charAt(0).toUpperCase();
      const bg = colorForString(name);
      fallbackElem = (
        <span className="w-full h-full flex items-center justify-center" style={{ backgroundColor: bg, color: "white" }}>
          {first || "?"}
        </span>
      );
    }
  }

  return <Avatar src={src} fallback={fallbackElem} size={size} alt={name} />;
} 