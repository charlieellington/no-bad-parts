"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

function getBaseUrl() {
  const hdrs = headers();
  const host = hdrs.get("x-forwarded-host") || hdrs.get("host") || process.env.NEXT_PUBLIC_SITE_URL || "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = getBaseUrl();

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

  // Stash the user-supplied metadata so we can write the row *after* e-mail verification.
  const signupMeta = {
    nameInput,
    hideName,
    note,
    referrer,
    utmSource,
  };
  const base64 = Buffer.from(JSON.stringify(signupMeta), "utf8").toString("base64");
  const base64url = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  const supabase = await createClient();
  const origin = getBaseUrl();

  // Send magic-link that bounces back to our callback route with the encoded payload.
  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?signup=${base64url}`,
    },
  });

  return encodedRedirect(
    "success",
    "/",
    "Sign-in link sent! Check your inbox to continue.",
  );
};
