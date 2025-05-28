import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export const isResendConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);

if (!isResendConfigured && process.env.NODE_ENV !== "production") {
  // eslint-disable-next-line no-console
  console.warn("[Waitlist Kit] RESEND_API_KEY not set – welcome emails disabled.");
} 