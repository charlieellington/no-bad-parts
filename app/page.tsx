import LandingHero from "@/components/landing-hero";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { FormMessage, type Message } from "@/components/form-message";
import WaitlistSuccessModal from "@/components/waitlist-success-modal";
import WaitlistList from "@/components/waitlist-list.client";
import WaitlistDemo from "@/components/waitlist-demo";
import ProfileCompletion from "@/components/profile/ProfileCompletion";
import { createClient } from "@/utils/supabase/server";
import LandingSections from "@/components/landing-sections";
import FounderIntro from "@/components/founder-intro";
import WaitlistJoinButton from "@/components/waitlist-join-button";
import BottomCta from "@/components/bottom-cta";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;

  const successMsg = params.success ? decodeURIComponent(params.success) : null;
  const errorMsg = params.error ? decodeURIComponent(params.error) : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      {successMsg && <WaitlistSuccessModal message={successMsg} />}
      {errorMsg && (
        <div className="flex justify-center mt-6 px-4">
          <FormMessage message={{ error: errorMsg }} />
        </div>
      )}
      {user ? (
        <>
          <ProfileCompletion />
          <LandingHero />
          <FounderIntro />
          {hasEnvVars ? (
            <>
              {/* Divider above waitlist */}
              <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
              <WaitlistList currentUserId={user.id} />
              <div className="flex justify-center mt-8">
                <WaitlistJoinButton />
              </div>
              {/* Divider below waitlist */}
              <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
            </>
          ) : (
            <>
              {/* Divider above waitlist (demo) */}
              <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
              <WaitlistDemo />
              <div className="flex justify-center mt-8">
                <WaitlistJoinButton />
              </div>
              {/* Divider below waitlist (demo) */}
              <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
            </>
          )}
          <LandingSections />
          <BottomCta />
          
          {/* Premium CTA Section */}
          <section className="mx-auto max-w-4xl px-4 py-8">
            <div className="bg-card p-8 text-center space-y-4">
              <p className="text-lg font-medium">
                Really excited? Join for €100 for a years access and try a session straight away.
              </p>
              <div className="flex justify-center">
                <a
                  href="https://buy.stripe.com/dRm7szbWRex59bC88gdZ60n"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 font-medium transition-colors"
                >
                  Buy Now
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                You'll be taken to a Stripe checkout page and after payment you'll be directed to a cal.com calendar app to book a call with me. Thank you!
              </p>
            </div>
          </section>
        </>
      ) : (
        <>
          <LandingHero />
          <FounderIntro />
          {hasEnvVars ? (
            <>
              {/* Divider above waitlist */}
              <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
              <WaitlistList />
              <div className="flex justify-center mt-8">
                <WaitlistJoinButton />
              </div>
              {/* Divider below waitlist */}
              <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
            </>
          ) : (
            <>
              {/* Divider above waitlist (demo) */}
              <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
              <WaitlistDemo />
              <div className="flex justify-center mt-8">
                <WaitlistJoinButton />
              </div>
              {/* Divider below waitlist (demo) */}
              <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-8" />
            </>
          )}
          <LandingSections />
          <BottomCta />
          
          {/* Premium CTA Section */}
          <section className="mx-auto max-w-4xl px-4 py-8">
            <div className="bg-card p-8 text-center space-y-4">
              <p className="text-lg font-medium">
                Really excited? Join for €100 for a years access and try a session straight away.
              </p>
              <div className="flex justify-center">
                <a
                  href="https://buy.stripe.com/dRm7szbWRex59bC88gdZ60n"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 py-2 font-medium transition-colors"
                >
                  Buy Now
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                You'll be taken to a Stripe checkout page and after payment you'll be directed to a cal.com calendar app to book a call with me. Thank you!
              </p>
            </div>
          </section>
        </>
      )}
    </>
  );
}
