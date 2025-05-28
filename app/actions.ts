"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

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

  // Determine stored name
  let name: string | null = nameInput.trim() || null;
  if (hideName || !name) {
    const { getRandomAnimal } = await import("@/utils/random-animal");
    name = `Anon ${getRandomAnimal()}`;
  }

  const supabase = await createClient();

  // Build insert payload conditionally (omit note if migration not yet applied)
  const payload: Record<string, any> = {
    email,
    name,
    hidden: hideName,
    referrer,
    utm_source: utmSource,
  };
  if (note) payload.note = note;

  const { error: insertError } = await supabase
    .from("waitlist_signups")
    .insert(payload);

  if (insertError) {
    console.error(insertError.message);
    return encodedRedirect("error", "/", "Could not join waitlist");
  }

  // Send magic-link email
  const origin = (await headers()).get("origin");
  await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  return encodedRedirect(
    "success",
    "/",
    "Sign-in link sent! Check your inbox to continue.",
  );
};
