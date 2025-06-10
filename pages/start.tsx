import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function StartPage() {
  const partnerUrl = "https://www.nobadpartscollective.com/session/partner";
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(partnerUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 space-y-12">
      <section className="space-y-6 text-center">
        <h1 className="text-3xl font-bold">Quick-start a No&nbsp;Bad&nbsp;Parts room</h1>
        <p className="text-muted-foreground">Launch the video call as the facilitator, then share the partner link.</p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/session/facilitator">
            <Button variant="default" size="lg">Facilitator Call Start</Button>
          </Link>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="lg" onClick={copyToClipboard}>
                  {copied ? "Copied!" : "Copy Partner Link"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{partnerUrl}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Link href="/session/partner" className="sm:ml-2">
            <Button variant="secondary" size="lg">Partner Call Start</Button>
          </Link>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="space-y-8">
        <h2 className="text-2xl font-semibold text-center">Quick Start Guide</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center space-y-4 p-6 bg-orange-50 rounded-lg">
            <img src="/assets/facilitator.jpg" alt="Video call screenshot" className="rounded shadow-md object-cover h-40 w-full" />
            <p className="font-medium">Real, face-to-face presence — no chatbot monologues.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4 p-6 bg-orange-50 rounded-lg">
            <img src="/assets/2.jpg" alt="Coach panel prompt" className="rounded shadow-md object-cover h-40 w-full" />
            <p className="font-medium">AI stays backstage, offering prompts so the facilitator can stay present.</p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4 p-6 bg-orange-50 rounded-lg">
            <img src="/assets/partcipant.jpg" alt="Role swap" className="rounded shadow-md object-cover h-40 w-full" />
            <p className="font-medium">Role-swap model: everyone gives as much as they receive.</p>
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="space-y-4" id="details">
        <h2 className="text-2xl font-semibold">Details</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>
            Both pages embed Daily Prebuilt video (think Google Meet). The facilitator also sees a live <strong>Coach Panel</strong> that fills with AI hints.
          </li>
          <li>
            The facilitator opens the session and reads a short introduction to the partner.
          </li>
          <li>
            The partner speaks about how they feel—or about their parts—as if talking to an IFS therapist.
          </li>
          <li>
            A silent AI agent joins, listens only to the partner, transcribes with Whisper, and asks GPT-4 for gentle IFS-style suggestions.
          </li>
          <li>
            Hints appear in under two seconds and are visible only to the facilitator, who reads them aloud to guide the session.
          </li>
          <li>
            Human-to-human connection stays front and centre—the AI is just a backstage helper.
          </li>
          <li>
            Try mute / unmute, screen-share, or mobile. Audio is processed securely via OpenAI and nothing is stored.
          </li>
        </ul>
      </section>
    </main>
  );
} 