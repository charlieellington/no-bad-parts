import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getRandomAnimal } from "@/utils/random-animal";
import { resend, isResendConfigured } from "@/lib/resend";
import WelcomeEmail from "@/components/emails/WelcomeEmail";

// Helper: base64-url decode ( Node <v18.13 lacks 'base64url' codec )
function base64urlDecode(str: string): string {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = 4 - (padded.length % 4 || 4);
  const full = padded + "=".repeat(padLen % 4);
  return Buffer.from(full, "base64").toString();
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirect_to") ?? "/";
  const signupParam = requestUrl.searchParams.get("signup"); // legacy fallback
  const origin = requestUrl.origin;

  // Prepare a response we can attach cookies to
  const response = NextResponse.redirect(`${origin}${redirectTo}`);

  if (code) {
    // Bridge cookies from request -> response
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    await supabase.auth.exchangeCodeForSession(code);

    // Fetch the now-authenticated user to inspect metadata
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Determine signup metadata either from query param (legacy) or user_metadata
    let meta: any | null = null;
    if (signupParam) {
      try {
        meta = JSON.parse(base64urlDecode(signupParam));
      } catch {}
    }
    if (!meta && user?.user_metadata?.signupMeta) {
      meta = user.user_metadata.signupMeta;
    }

    if (meta && user && user.email) {
      const { nameInput, hideName, note, referrer, utmSource } = meta;

      // Display name logic
      let name: string | null = (nameInput ?? "").trim() || null;
      if (hideName || !name) name = `Anon ${getRandomAnimal()}`;

      // Determine next rank
      const { count } = await supabase
        .from("waitlist_public")
        .select("id", { count: "exact", head: true });
      const nextRank = (count ?? 0) + 1;

      const payload: Record<string, any> = {
        email: user.email,
        name,
        hidden: hideName,
        rank: nextRank,
        referrer: referrer ?? null,
        utm_source: utmSource ?? null,
      };
      if (note) payload.note = note;

      const { error } = await supabase.from("waitlist_signups").insert(payload);
      if (!error && isResendConfigured && process.env.ENABLE_WELCOME_EMAIL === "true") {
        // Fire off welcome email (non-blocking)
        resend.emails
          .send({
            from: process.env.RESEND_FROM_EMAIL!,
            to: user.email,
            subject: "You're on the list 🎉",
            react: WelcomeEmail({ name }),
          })
          .catch((e) => console.warn("Resend error", e));
      }

      // clear metadata to avoid reprocessing
      try {
        await supabase.auth.updateUser({ data: { signupMeta: null } });
      } catch {}
    }
  }

  return response;
}
