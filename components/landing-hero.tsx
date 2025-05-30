import WaitlistModal from "@/components/waitlist-modal";
import content from "@/content.json";
import { createClient } from "@/utils/supabase/server";

export default async function LandingHero() {
  const { heroTitle, heroSubtitle, ctaText, features } = content as {
    heroTitle: string;
    heroSubtitle: string;
    ctaText: string;
    features?: string[];
  };

  // Check for existing session (server-side)
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const showJoin = !session;

  return (
    <section className="flex flex-col items-center gap-10 pt-16 pb-0 px-4 text-center">
      <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-3xl">
        {heroTitle}
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl">
        {heroSubtitle}
      </p>

      {showJoin && <WaitlistModal triggerText={ctaText} />}

      {features && features.length ? (
        <ul className="grid gap-3 mt-8 sm:grid-cols-2 md:grid-cols-4 max-w-4xl w-full">
          {features.map((feature) => (
            <li
              key={feature}
              className="rounded-md border bg-card p-4 text-sm font-medium"
            >
              {feature}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent mt-8 mb-4" />
    </section>
  );
} 