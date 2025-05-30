"use client";

import useSWR from "swr";
import AvatarUploadCard from "@/components/profile/AvatarUploadCard";
import JoinReasonCard from "@/components/profile/JoinReasonCard";

export default function ProfileCompletion() {
  const { data, mutate } = useSWR("/api/profile", (url) => fetch(url).then((r) => r.json()));

  if (!data) return null; // could show loader
  if (data.error) return null;

  const row = data.data as {
    id: string;
    name: string;
    avatar_url: string | null;
    note: string | null;
  };

  // Decide which card to show
  if (!row.avatar_url) {
    return (
      <AvatarUploadCard
        userId={row.id}
        name={row.name}
        onDone={() => mutate()}
      />
    );
  }

  if (!row.note) {
    return <JoinReasonCard initialReason={null} onDone={() => mutate()} />;
  }

  return null; // completed
} 