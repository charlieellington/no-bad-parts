import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;

  // If we already sent the magic link, show confirmation only
  if ("success" in searchParams) {
    return (
      <div className="w-full flex-1 flex items-center justify-center p-4">
        <FormMessage message={searchParams} />
      </div>
    );
  }

  return (
    <form className="flex-1 flex flex-col min-w-64">
      <h1 className="text-2xl font-medium">Sign in</h1>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">Email</Label>
        <Input name="email" placeholder="you@example.com" required />
        <SubmitButton pendingText="Sending link..." formAction={signInAction}>
          Send Magic Link
        </SubmitButton>
      </div>
    </form>
  );
}
