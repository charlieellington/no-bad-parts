// getAnimalAvatarUrl – returns a photo URL for a given animal name.
// Uses Unsplash source endpoint (random but cached per query string).
export function getAnimalAvatarUrl(animal: string, size = 80): string {
  // Unsplash source creates redirect to random image matching query
  return `https://source.unsplash.com/${size}x${size}/?${encodeURIComponent(animal)}`;
} 