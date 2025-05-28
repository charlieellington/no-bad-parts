import Link from "next/link";
import { Button } from "./ui/button";

export default function DeployButton() {
  return (
    <>
      <Link
        href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcharlieellington%2Fwaitlist-kit&project-name=waitlist-kit&repository-name=waitlist-kit&demo-title=Waitlist+Kit&demo-description=Collect+emails+before+launch+with+Next.js%2C+Supabase%2C+Tailwind+%2B+shadcn%2Fui.&demo-url=https%3A%2F%2Fwaitlist-kit-demo.vercel.app%2F&demo-image=https%3A%2F%2Fraw.githubusercontent.com%2Fcharlieellington%2Fwaitlist-kit%2Fmain%2Fpublic%2Fog-waitlist-kit.png&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=Add+the+two+values+from+your+Supabase+project%E2%80%99s+API+settings.&envLink=https%3A%2F%2Fsupabase.com%2Fdashboard%2Fproject%2F_%2Fsettings%2Fapi"
        target="_blank"
      >
        <Button className="flex items-center gap-2" size={"sm"}>
          <svg
            className="h-3 w-3"
            viewBox="0 0 76 65"
            fill="hsl(var(--background)/1)"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="inherit" />
          </svg>
          <span>Deploy to Vercel</span>
        </Button>
      </Link>
    </>
  );
}
