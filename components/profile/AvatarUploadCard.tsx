"use client";

import { useState, ChangeEvent } from "react";
import { uploadAvatar } from "@/lib/storage/upload-avatar";
import { WaitlistAvatar } from "@/components/waitlist-avatar";
import { useRouter } from "next/navigation";

export default function AvatarUploadCard({
  userId,
  name,
  onDone,
}: {
  userId: string;
  name: string;
  onDone?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
    setError(null);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const publicUrl = await uploadAvatar(userId, file);
      // Persist URL via API PATCH
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: publicUrl }),
      });
      await fetch("/api/profile/promote", { method: "POST" });
      onDone?.();
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    }
    setUploading(false);
  }

  return (
    <div className="border rounded-md p-4 flex flex-col gap-3 max-w-md w-full mx-auto bg-background/50">
      <p className="font-medium">Add a profile photo (optional)</p>
      <div className="flex items-center gap-3">
        <WaitlistAvatar name={name} avatarUrl={null} hidden={false} size={40} />
        <input type="file" accept="image/*" onChange={handleFileChange} className="flex-1 text-sm" />
      </div>
      <button
        type="button"
        onClick={handleUpload}
        disabled={uploading || !file}
        className="self-end bg-primary text-primary-foreground rounded-md px-4 py-2 disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Upload"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
} 