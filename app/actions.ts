"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function getBaseUrl() {
  const hdrs = await headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || process.env.NEXT_PUBLIC_SITE_URL || "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = await getBaseUrl();

  if (!email) {
    return encodedRedirect("error", "/sign-in", "Email is required");
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return encodedRedirect(
    "success",
    "/sign-in",
    "Sign-in link sent! Check your inbox to continue.",
  );
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const joinWaitlistAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const nameInput = formData.get("name")?.toString() ?? "";
  const hideName = formData.get("hideName") === "on";
  const rawNote = formData.get("note")?.toString() ?? "";
  const note = rawNote.trim() === "" ? null : rawNote.trim();
  const referrer = formData.get("referrer")?.toString() ?? null;
  const utmSource = formData.get("utm_source")?.toString() ?? null;

  if (!email) {
    return encodedRedirect("error", "/", "Email is required");
  }

  // Persist form data inside the user metadata so we can pick it up after verification.
  const signupMeta = {
    nameInput,
    hideName,
    note,
    referrer,
    utmSource,
  };

  const supabase = await createClient();
  const origin = await getBaseUrl();

  // Send magic-link that bounces back to our callback route.
  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: { signupMeta },
    },
  });

  return encodedRedirect(
    "success",
    "/",
    "Sign-in link sent! Check your inbox to continue.",
  );
};
