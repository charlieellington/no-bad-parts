import LandingHero from "@/components/landing-hero";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { FormMessage, type Message } from "@/components/form-message";
import WaitlistSuccessModal from "@/components/waitlist-success-modal";
import WaitlistList from "@/components/waitlist-list.client";
import WaitlistDemo from "@/components/waitlist-demo";
import ProfileCompletion from "@/components/profile/ProfileCompletion";
import { createClient } from "@/utils/supabase/server";

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
          {hasEnvVars ? (
            <WaitlistList currentUserId={user.id} />
          ) : (
            <WaitlistDemo />
          )}
          <LandingHero />
        </>
      ) : (
        <>
          <LandingHero />
          {hasEnvVars ? <WaitlistList /> : <WaitlistDemo />}
        </>
      )}
    </>
  );
}
