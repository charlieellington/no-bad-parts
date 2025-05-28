# Waitlist Kit 🚀

*A one-click deploy template that gives you a "Coming soon → Join the wait-list" page in minutes.*

![Screenshot of Waitlist Kit landing page](./public/og-waitlist-kit.png)

---

## 1  Create a Supabase project

1. Go to <https://database.new> (shortcut to Supabase).  
2. Pick a name, password and **Create new project** – the database spins up in ~2 min.

## 2  Apply the database schema

Your Supabase project is empty—let's add the **waitlist** table, RLS policies, and view.

### One-click (SQL editor)

1. In the Supabase dashboard open **SQL Editor → New query**.  
2. Copy-paste the contents of [`supabase/migrations/init.sql`](./supabase/migrations/init.sql).  
3. Click **Run** – you should see `RUN` in green.

### CLI alternative

```bash
supabase link --project-ref <your-project-ref>   # one-time
supabase db push --file supabase/migrations/init.sql
```

## 3  Grab your API keys

Open the new project → **Settings → API** and copy:

| key | value location |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | "Project URL" |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | "anon (public)" key |

*(You'll paste these in the next step.)*

## 4  Quick-start deploy

### Option A – Launch on Vercel (recommended)

1. Click the button ↓. Choose the Git scope & repo name you want.  
2. Hit **Create** → on the *Configure Project* screen fill the two env-vars with the keys from **Step 3**.  
3. Click **Deploy** – Vercel builds the app and gives you a live URL.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcharlieellington%2Fwaitlist-kit&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY&envDescription=Add+your+Supabase+project+URL+and+anon+key.&envLink=https%3A%2F%2Fsupabase.com%2Fdashboard%2Fproject%2F_%2Fsettings%2Fapi)

### Option B – Run locally

```bash
# 1. Clone the repo
npx create-next-app waitlist-kit -e https://github.com/charlieellington/waitlist-kit
cd waitlist-kit

# 2. Add your keys
cp env.example .env.local
# open .env.local and paste the URL + anon key from Step 3

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

## 5  Customise the template

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
