"use client";

import Image from "next/image";
import Link from "next/link";

export default function LandingSections() {
  return (
    <section className="mx-auto max-w-4xl px-4 space-y-20 pb-8">
      {/* Why Section */}
      <div id="why-no-bad" className="grid md:grid-cols-2 gap-10 items-center">
        <Image
          src="/assets/nobadpartsbook.webp"
          alt="No Bad Parts book cover"
          width={400}
          height={300}
          className="rounded-md shadow"
        />
        <div>
          <h2 className="text-2xl font-bold mb-4">Why "No Bad Parts"?</h2>
          <p className="leading-relaxed text-muted-foreground">
            Our name comes from Richard Schwartz's book <em>No Bad Parts</em>. We draw on
            Internal Family Systems (IFS) ideas, which teach that every part of you
            serves a purpose. We're <strong>not</strong> affiliated with Schwartz or IFS,
            and we're <strong>not</strong> a substitute for professional care. Think of
            us as a peer-led supplement for personal exploration.
          </p>
        </div>
      </div>

      {/* Simple collective section */}
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-2xl font-bold mb-4">A Simple & Accessible Collective</h2>
          <p className="leading-relaxed text-muted-foreground">
            Many self-help tools rely on apps or books. We go beyond that. Here, you
            connect with a real person who can hold space while you explore your inner
            parts. Their presence keeps you grounded and helps you maintain a
            meditative focus, rather than jumping in and out of a digital interface.
          </p>
        </div>
        <Image
          src="/assets/collective.png"
          alt="Peers supporting each other"
          width={400}
          height={300}
          className="rounded-md shadow"
        />
      </div>

      {/* Concept overview */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">How It All Fits Together</h2>
        <p className="max-w-3xl mx-auto text-muted-foreground text-center">
          Two peers meet in a private video room. One explores; the other
          facilitates using gentle, IFS-inspired prompts. A silent AI agent listens
          only to the explorer and streams helpful questions to the facilitator's
          coach panel—keeping the human connection front and centre.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 max-w-3xl mx-auto w-full">
          <li className="rounded-md border bg-card p-4 text-sm font-medium text-muted-foreground">
            Real, face-to-face presence — no chatbot monologues.
          </li>
          <li className="rounded-md border bg-card p-4 text-sm font-medium text-muted-foreground">
            AI stays backstage, offering prompts so the facilitator can stay present.
          </li>
          <li className="rounded-md border bg-card p-4 text-sm font-medium text-muted-foreground">
            Role-swap model: everyone gives as much as they receive.
          </li>
        </ul>
      </div>

      {/* How it works */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">How It Works</h2>
        <ul className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto w-full">
          {/* Book */}
          <li className="rounded-md border bg-card p-6 flex flex-col items-center text-center">
            <Image
              src="/assets/book.webp"
              alt="Book a session illustration"
              width={120}
              height={120}
              className="mb-4 rounded-md object-cover"
            />
            <h3 className="font-semibold mb-1">Book</h3>
            <p className="text-sm text-muted-foreground">
              Sign up and schedule a session with a Collective member.
            </p>
          </li>

          {/* Explore */}
          <li className="rounded-md border bg-card p-6 flex flex-col items-center text-center">
            <Image
              src="/assets/explore.webp"
              alt="Person exploring inner world illustration"
              width={120}
              height={120}
              className="mb-4 rounded-md object-cover"
            />
            <h3 className="font-semibold mb-1">Explore IFS</h3>
            <p className="text-sm text-muted-foreground">
              Stay present in a meditative state while a peer guides you in a live IFS
              session.
            </p>
          </li>

          {/* Facilitate */}
          <li className="rounded-md border bg-card p-6 flex flex-col items-center text-center">
            <Image
              src="/assets/facilitate.webp"
              alt="Facilitate with AI illustration"
              width={120}
              height={120}
              className="mb-4 rounded-md object-cover"
            />
            <h3 className="font-semibold mb-1">Facilitate with AI</h3>
            <p className="text-sm text-muted-foreground">
              Guide someone else as a facilitator—everyone gives as much as they
              receive.
            </p>
          </li>
        </ul>
      </div>

      {/* Ethos */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Our Ethos</h2>
        <p className="text-muted-foreground">
          We're all equals, here to support one another. There's no therapist–client
          divide. Yet we're <strong>not</strong> therapists or counsellors. If you have
          urgent or ongoing mental-health needs, please seek help from a qualified
          professional.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 max-w-4xl mx-auto w-full">
          <li className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
            <strong className="block mb-1">Compassion &amp; Respect</strong>
            Every part of us deserves a voice.
          </li>
          <li className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
            <strong className="block mb-1">Peer Support, Not Therapy</strong>
            A friendly place to explore, not a replacement for licensed care.
          </li>
          <li className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
            <strong className="block mb-1">Shared Learning</strong>
            We keep refining our approach and welcome feedback.
          </li>
        </ul>
        <p className="italic pt-2 text-muted-foreground">
          Embrace your parts. They have much to say—none of them bad, each with its own
          wisdom.
        </p>
      </div>
    </section>
  );
} 