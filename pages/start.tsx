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

      <section className="space-y-4 text-left">
        <h2 className="text-2xl font-semibold">What to expect</h2>
        <p>
          • Both pages embed Daily Prebuilt video. The facilitator sees an additional <strong>Coach Panel</strong> that updates with AI-generated hints.
        </p>
        <p>
          • A silent AI agent joins the room, listens only to the partner's audio, transcribes it with Whisper, and feeds the transcript to GPT-4 to produce Internal Family Systems (IFS) coaching suggestions.
        </p>
        <p>
          • Hints arrive in &lt;2&nbsp;seconds and are <em>only</em> visible to the facilitator.
        </p>
        <p>
          • Feel free to explore: mute/unmute, screen-share, or test on mobile. Your conversation never leaves the secure OpenAI processing pipeline.
        </p>
      </section>
    </main>
  );
} 