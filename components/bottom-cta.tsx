import WaitlistJoinButton from "@/components/waitlist-join-button";

export default function BottomCta() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <div className="rounded-md border bg-card p-8 text-center space-y-4 shadow-sm">
        <h2 className="text-2xl font-bold">
          Sign up for early access and updates
        </h2>
        <p className="text-muted-foreground">
          Join the wait-list to try a peer-guided IFS session—or simply stay in the
          loop as we open new spots.
        </p>
        <div className="flex justify-center">
          <WaitlistJoinButton label="Join the wait-list" />
        </div>
      </div>
    </section>
  );
} 