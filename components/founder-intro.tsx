import Image from "next/image";
import Link from "next/link";
import WaitlistJoinButton from "@/components/waitlist-join-button";

export default async function FounderIntro() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
      <div>
        <h2 className="text-2xl font-bold mb-4">Hi, I'm Charlie 👋</h2>
        <p className="leading-relaxed text-muted-foreground">
          I'm a designer-engineer fascinated by Internal Family Systems and learning I'm learning to code with AI help in Cursor and other tools. I'm trying out a new community/collective where people offer each other Internal Family System (IFS) sessions. This alpha test aims to see if peer-to-peer sessions—using AI as a listening tool but still keeping a human presence—can benefit others. All feedback is welcome, good or bad.
        </p>
        <br></br>
        <p className="leading-relaxed text-muted-foreground">
          Please sign up to the waitlist to try a session or stay updated by email.
        </p>
        <div className="flex items-center gap-4 mt-6">
          <WaitlistJoinButton className="mt-0" />
          <Link
            href="#why-no-bad"
            className="inline-flex items-center justify-center rounded-md border px-6 py-3 font-medium text-foreground hover:bg-muted transition-colors"
          >
            More info
          </Link>
        </div>
      </div>
      <Image
        src="/assets/charlie-no-bad.png"
        alt="Charlie Ellington enjoying an apple"
        width={350}
        height={350}
        className="rounded-md shadow object-cover"
      />
    </section>
  );
} 