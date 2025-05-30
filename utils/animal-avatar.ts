// getAnimalAvatarUrl – returns an avatar SVG URL for a given animal name.
// Switched from Unsplash (prone to 503 errors) to DiceBear which is free, fast and CORS-friendly.
export function getAnimalAvatarUrl(animal: string, size = 80): string {
  const seed = encodeURIComponent(animal.trim().toLowerCase());
  // DiceBear v8 – "notionists-neutral" style produces fun rounded avatars.
  // Public CDN, supports size param and is cache-friendly.
  return `https://api.dicebear.com/8.x/notionists-neutral/svg?seed=${seed}&size=${size}`;
} 