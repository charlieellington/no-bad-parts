// getAnimalAvatarUrl – returns an avatar SVG URL for a given animal name.
// Switched from Unsplash (prone to 503 errors) to DiceBear which is free, fast and CORS-friendly.
export function getAnimalAvatarUrl(animal: string, size = 80): string {
  const seed = encodeURIComponent(animal.trim().toLowerCase());
  // DiceBear v9 – switch to the "dylan" style and force the mood to "superHappy" for a friendly look.
  // Public CDN, supports size & mood params and is cache-friendly.
  return `https://api.dicebear.com/9.x/dylan/svg?seed=${seed}&size=${size}&mood=superHappy`;
} 