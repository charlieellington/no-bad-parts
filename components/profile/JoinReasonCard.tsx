"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function JoinReasonCard({
  initialReason,
  onDone,
}: {
  initialReason: string | null;
  onDone?: () => void;
}) {
  const [reason, setReason] = useState(initialReason ?? "");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (initialReason) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;

    setSending(true);
    setError(null);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: reason.trim() }),
      });
      await fetch("/api/profile/promote", { method: "POST" });
      onDone?.();
      router.refresh();
    } catch (err: any) {
      setError("Could not save – please try again.");
    }
    setSending(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border rounded-md p-4 flex flex-col gap-3 max-w-md w-full mx-auto bg-background/50"
    >
      <label htmlFor="join-reason" className="font-medium">
        Tell us why you're excited (optional)
      </label>
      <textarea
        id="join-reason"
        className="rounded-md border p-2 h-28 resize-y"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        required
      />
      <button
        type="submit"
        disabled={sending || !reason.trim()}
        className="self-end bg-primary text-primary-foreground rounded-md px-4 py-2 disabled:opacity-50"
      >
        {sending ? "Sending…" : "Send"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </form>
  );
} 