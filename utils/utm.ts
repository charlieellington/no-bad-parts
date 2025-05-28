"use client";

export function getUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    if (key.startsWith("utm_")) {
      result[key] = value;
    }
  });
  return result;
} 