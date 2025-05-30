import WaitlistModal from "@/components/waitlist-modal";
import { createClient } from "@/utils/supabase/server";

export default async function WaitlistJoinButton({
  label = "Join the wait-list",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return null;

  return (
    <div className={`mt-6 ${className}`.trim()}>
      <WaitlistModal triggerText={label} />
    </div>
  );
} 