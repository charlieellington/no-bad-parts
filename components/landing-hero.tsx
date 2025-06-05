import WaitlistModal from "@/components/waitlist-modal";
import content from "@/content.json";
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Users, Heart, Bot } from "lucide-react";

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

  // Icon mapping for features
  const getFeatureIcon = (feature: string) => {
    if (feature.includes("Book")) return <Calendar className="w-6 h-6 mb-3 text-primary" />;
    if (feature.includes("Receive")) return <Users className="w-6 h-6 mb-3 text-primary" />;
    if (feature.includes("Give back")) return <Heart className="w-6 h-6 mb-3 text-primary" />;
    if (feature.includes("AI")) return <Bot className="w-6 h-6 mb-3 text-primary" />;
    return <Calendar className="w-6 h-6 mb-3 text-primary" />; // fallback
  };

  return (
    <section className="flex flex-col items-center gap-10 pt-16 pb-0 px-4 text-center">
      <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-3xl">
        {heroTitle}
      </h1>
      <p className="text-lg text-muted-foreground max-w-2xl">
        {heroSubtitle}
      </p>

      {/* Call to Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-2">
        {showJoin && <WaitlistModal triggerText={ctaText} />}
        <Link 
          href="#the-app" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
        >
          More info
        </Link>
      </div>

      {/* Hero Images - Side by side on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full mt-8">
        <div className="flex flex-col items-center">
          <Image
            src="/assets/facilitator.jpg"
            alt="Facilitator in an IFS session"
            width={400}
            height={300}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground mt-2 font-medium">Facilitator</p>
        </div>
        <div className="flex flex-col items-center">
          <Image
            src="/assets/partcipant.jpg"
            alt="Participant in an IFS session"
            width={400}
            height={300}
            className="w-full"
          />
          <p className="text-sm text-muted-foreground mt-2 font-medium">Participant</p>
        </div>
      </div>

      {features && features.length ? (
        <ul className="grid gap-3 mt-8 sm:grid-cols-2 md:grid-cols-4 max-w-4xl w-full">
          {features.map((feature) => (
            <li
              key={feature}
              className="rounded-md bg-card p-4 text-sm font-medium flex flex-col items-center text-center"
            >
              {getFeatureIcon(feature)}
              {feature}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent mt-8 mb-4" />
    </section>
  );
} 