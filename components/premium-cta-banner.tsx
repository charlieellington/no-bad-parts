"use client";

import useSWR from "swr";

export default function PremiumCtaBanner() {
  const { data } = useSWR("/api/profile", (url) => fetch(url).then((r) => r.json()));

  if (!data) return null;
  if (data.error) return null;

  const row = data.data as {
    id: string;
    name: string;
    avatar_url: string | null;
    note: string | null;
  };

  // Only show for completed users (have both avatar and note)
  const isCompleted = row.avatar_url && row.note;
  if (!isCompleted) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-primary/20">
      <div className="mx-auto max-w-4xl px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="font-medium text-foreground">
              🎉 Really excited? Ready to start your IFS journey?
            </p>
            <p className="text-sm text-muted-foreground">
              Join for €100 for a years access and try a demo session with Charlie immediately.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href="https://buy.stripe.com/dRm7szbWRex59bC88gdZ60n"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 font-medium transition-colors whitespace-nowrap"
            >
              Get Instant Access
            </a>
            <p className="text-xs text-muted-foreground">
              or continue with free waitlist below
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 