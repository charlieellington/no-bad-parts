import LandingHero from "@/components/landing-hero";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { FormMessage, type Message } from "@/components/form-message";
import WaitlistSuccessModal from "@/components/waitlist-success-modal";
import WaitlistList from "@/components/waitlist-list.client";
import WaitlistDemo from "@/components/waitlist-demo";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;

  const successMsg = params.success ? decodeURIComponent(params.success) : null;
  const errorMsg = params.error ? decodeURIComponent(params.error) : null;

  return (
    <>
      {successMsg && <WaitlistSuccessModal message={successMsg} />}
      {errorMsg && (
        <div className="flex justify-center mt-6 px-4">
          <FormMessage message={{ error: errorMsg }} />
        </div>
      )}
      <LandingHero />
      {hasEnvVars ? <WaitlistList /> : <WaitlistDemo />}
      <main className="flex-1 flex flex-col gap-6 px-4">
        <h2 className="font-medium text-xl mb-4">Next steps</h2>
        {hasEnvVars ? <SignUpUserSteps /> : <ConnectSupabaseSteps />}
      </main>
    </>
  );
}
