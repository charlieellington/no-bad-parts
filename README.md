# Waitlist Kit 🚀

*A one-click deploy template that gives you a "Coming soon → Join the wait-list" page in minutes.*

![Screenshot of Waitlist Kit landing page](./public/og-waitlist-kit.png)

---

## 1  Create a Supabase project

1. Go to <https://database.new> (shortcut to Supabase).  
2. Pick a name, password and **Create new project** – the database spins up in ~2 min.

## 2  Grab your API keys

Open the new project → **Settings → API** and copy:

| key | value location |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | "anon (public)" key |

*(You'll paste these in the next step.)*

## 3  Quick-start deploy

### Option A – Launch on Vercel (recommended)

1. Click the button ↓. Choose the Git scope & repo name you want.  
2. Hit **Create** → on the *Configure Project* screen fill the two env-vars with the keys from **Step 2**.  
3. Click **Deploy** – Vercel builds the app and gives you a live URL.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcharlieellington%2Fwaitlist-kit&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=Add+your+Supabase+project+URL+and+anon+key.&envLink=https%3A%2F%2Fsupabase.com%2Fdashboard%2Fproject%2F_%2Fsettings%2Fapi)

### Option B – Run locally

```bash
# 1. Clone the repo
npx create-next-app waitlist-kit -e https://github.com/charlieellington/waitlist-kit
cd waitlist-kit

# 2. Add your keys
cp env.example .env.local
# open .env.local and paste the URL + anon key from Step 2

# 3. (Optional) run SQL migrations if you created a fresh database
supabase db push --file supabase/migrations/init.sql

# 4. Start the dev server
pnpm install
pnpm dev
```

Visit `http://localhost:3000` – you'll see the landing page, modal form, and public list.

## 4  Customise the template

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
