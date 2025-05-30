const colors = [
  "#64748b", // slate-500
  "#0ea5e9", // sky-500
  "#22c55e", // green-500
  "#ec4899", // pink-500
  "#f97316", // orange-500
  "#14b8a6", // teal-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
];

export function colorForString(str: string | null): string {
  if (!str) return "#64748b";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % colors.length;
  return colors[idx];
} 