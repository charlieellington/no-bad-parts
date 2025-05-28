import * as React from "react";

export function WelcomeEmail({ name }: { name: string | null }) {
  return (
    <div style={{ fontFamily: 'Inter, Arial, sans-serif', lineHeight: '1.4', fontSize: 16, color: '#111' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Welcome to the Waitlist!</h1>
      <p>
        {name ? `${name}, ` : ""}thanks for joining the wait-list. We'll keep you posted on our launch and progress.
      </p>
      <p style={{ marginTop: 24, fontSize: 14, color: '#555' }}>
        You received this e-mail because you explicitly signed up and verified your address via magic-link. If this wasn't you, feel free to ignore.
      </p>
      <p style={{ marginTop: 32 }}>Cheers,<br />The Waitlist Kit team</p>
    </div>
  );
}

export default WelcomeEmail; 