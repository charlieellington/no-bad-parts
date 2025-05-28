"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/submit-button";
import { joinWaitlistAction } from "@/app/actions";
import { getUtmParams } from "@/utils/utm";

export default function WaitlistModal({ triggerText }: { triggerText: string }) {
  const [utm, setUtm] = useState<Record<string, string>>({});
  const [referrer, setReferrer] = useState<string>("");

  useEffect(() => {
    setUtm(getUtmParams());
    setReferrer(document.referrer);
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-primary-foreground font-medium shadow transition-colors hover:bg-primary/90 focus:outline-none">{triggerText}</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Join the Waitlist</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Pop in your email and we'll send you a magic link. No spam, promise.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" action={joinWaitlistAction}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" placeholder="you@example.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <Input id="name" name="name" placeholder="Eg. Charlie" />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="hideName" name="hideName" />
            <Label htmlFor="hideName" className="cursor-pointer">
              Hide my name from the public list below
            </Label>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Tell us why you're excited <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <Textarea id="note" name="note" placeholder="A quick note – totally optional!" />
          </div>

          {/* hidden tracking inputs */}
          <input type="hidden" name="referrer" value={referrer} />
          {Object.entries(utm).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}

          <SubmitButton className="w-full" pendingText="Joining...">
            Send Magic Link
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
} 