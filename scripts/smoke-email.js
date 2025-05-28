const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const isResendConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);

(async () => {
  if (!isResendConfigured) {
    console.error("Re-Send keys missing – skip smoke test.");
    process.exit(0);
  }

  const to = process.env.TEST_EMAIL;
  if (!to) {
    console.error("Set TEST_EMAIL env var to receive the smoke message.");
    process.exit(1);
  }

  try {
    const { data } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to,
      subject: "Waitlist Kit – smoke test",
      text: "If you got this, your Re-Send config works!",
    });

    console.log("Sent ✅", data?.id || "");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})(); 