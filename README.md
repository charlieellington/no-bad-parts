# Waitlist Kit 🚀

[![Deploy with Vercel](https://img.shields.io/badge/Deploy_to-Vercel-%23000000?logo=vercel&logoColor=white)](#option-a-%E2%80%93-launch-on-vercel-recommended)
[![Built with Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

*A one-click deploy template that gives you a "Coming soon → Join the wait-list" page in minutes.*

![Screenshot of Waitlist Kit landing page](./public/og-waitlist-kit.png)

---

## 1  Create a Supabase project

1. Go to <https://database.new> (shortcut to Supabase).  
2. Pick a name, password and **Create new project** – the database spins up in ~2 min.

## 2  Apply the database schema

If you deploy with Vercel **and** connect your Supabase project in the deploy-wizard, *all SQL migrations run automatically* – skip ahead to Step&nbsp;3.

Creating the database by hand? Use the CLI once:

```bash
# one-time setup
supabase link --project-ref <your-project-ref>
# pushes every *.sql file in supabase/migrations/ (idempotent)
supabase db push
```

> The folder already contains everything you need: table, RLS policies, email-safe view, etc. Future changes are tracked as new files in the same directory.

## 3  (Optional) Add Re-Send e-mail keys

Waitlist Kit ships with a welcome e-mail. To enable it (and to brand Supabase's magic-link e-mails) create an account at [Re-Send](https://resend.com) and copy:

| key | where to find it |
| --- | --- |
| `RESEND_API_KEY` | Re-Send dashboard → **API Keys** |
| `RESEND_FROM_EMAIL` | A verified sender address (or the fallback `no-reply@resend.dev`) |

Don't have them yet? Skip this step – the site works without and logs a friendly warning.

> **Tip:** once keys are in place run `pnpm test:email` locally (requires `TEST_EMAIL=you@example.com`) to verify delivery.

By default the repo will **not** send the extra *Welcome* e-mail.  
If you'd like to enable it later simply add `ENABLE_WELCOME_EMAIL=true` to your env file.

## 4  Point Supabase to Re-Send (1 min)

In the Supabase dashboard open **Auth → Settings → SMTP** and paste:

| field | value |
|-------|-------|
| Host  | `smtp.resend.com` |
| Port  | `587` |
| User  | `apikey` |
| Password | your `RESEND_API_KEY` |
| Sender name | whatever you like (e.g. *Waitlist Kit*) |

Click **Save** → all Supabase OTP / magic-link e-mails now deliver via Re-Send.

*(Advanced: you can edit subjects & HTML under **Auth → Templates**.)*

## 5  Grab your API keys

Open the new project → **Settings → API** and copy:

| key | value location |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | "anon (public)" key |

*(You'll paste these in the next step.)*

## 6  Quick-start deploy

### Option A – Launch on Vercel (recommended)

1. Click the button ↓. Choose the Git scope & repo name you want.  
2. Hit **Create** → on the *Configure Project* screen fill the two env-vars with the keys from **Step 5**.  
3. Click **Deploy** – Vercel builds the app and gives you a live URL.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcharlieellington%2Fwaitlist-kit&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&optionalEnv=RESEND_API_KEY,RESEND_FROM_EMAIL&envDescription=Add+your+Supabase+URL+and+anon+key+(Re-Send+keys+optional).&envLink=https%3A%2F%2Fsupabase.com%2Fdashboard%2Fproject%2F_%2Fsettings%2Fapi)

### Option B – Run locally

```bash
# 1. Clone the repo
npx create-next-app waitlist-kit -e https://github.com/charlieellington/waitlist-kit
cd waitlist-kit

# 2. Add your keys
cp env.example .env.local
# open .env.local and paste the URL + anon key from Step 5
# (Optional) add the Re-Send keys from Step 3 for welcome e-mails

# 3. (Optional) run SQL migrations if you created a fresh database
supabase db push --file supabase/migrations/init.sql

# 4. Start the dev server
pnpm install
pnpm dev
```

#### Smoke-test

1. Visit `http://localhost:3000` (or your Vercel URL).  
2. The public list should render *"Join the waitlist"* header (no server error).  
3. Click **Join the waitlist →** enter your email → you should see your name appear in the list.

If that works you're ready to customise! 🎉

## 7  Customise the template

* **Landing copy** – edit `content.json` or tweak components in `components/`.
* **Branding** – update `public/og-waitlist-kit.png`, favicon, colours, etc.
* **Database** – add fields, adjust RLS and SQL in `supabase/migrations/`.

---

## Features

• **Next 14 App Router** – typed server actions, streaming, RSC.
• **Supabase** – Postgres, Auth (email magic-link), SQL migrations tracked in `supabase/migrations`.
• **Tailwind CSS + shadcn/ui** – no custom CSS.
• **Public wait-list view** – names only, never exposes email.
• **Magic-link auth** – optional sign-in to update your row.
• **Vercel × Supabase integration** – zero-config deploy.

---

MIT licence – free to modify, distribute & **sell**. 🎉

Built by Charlie Ellington – PRs & issues welcome!  
Roadmap in [`scratchpad-waitlist.md`](./energy-flow/pages/03-projects/Waitlist-app/scratchpad-waitlist.md).

### Handy scripts

```bash
pnpm dev      # start Next.js in development
pnpm lint     # eslint + prettier
pnpm build    # production build
pnpm start    # run the production build locally
```
