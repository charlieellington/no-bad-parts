const ANIMALS = [
  "Penguin",
  "Fox",
  "Otter",
  "Llama",
  "Koala",
  "Hedgehog",
  "Panda",
  "Dolphin",
  "Wolf",
  "Tiger",
  "Bear",
  "Cat",
  "Dog",
  "Rabbit",
  "Seal",
];

export function getRandomAnimal(): string {
  const idx = Math.floor(Math.random() * ANIMALS.length);
  return ANIMALS[idx];
} 