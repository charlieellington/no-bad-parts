"use client";

import useSWR from "swr";

interface ConditionalBottomPremiumCtaProps {
  children: React.ReactNode;
}

export default function ConditionalBottomPremiumCta({ children }: ConditionalBottomPremiumCtaProps) {
  const { data } = useSWR("/api/profile", (url) => fetch(url).then((r) => r.json()));

  // If no data yet, show the CTA (default behavior)
  if (!data) return <>{children}</>;
  
  // If there's an error fetching profile, show the CTA
  if (data.error) return <>{children}</>;

  const row = data.data as {
    id: string;
    name: string;
    avatar_url: string | null;
    note: string | null;
  };

  // If user has completed profile (has both avatar and note), don't show bottom CTA
  const isCompleted = row.avatar_url && row.note;
  if (isCompleted) return null;

  // Otherwise, show the bottom CTA
  return <>{children}</>;
} 