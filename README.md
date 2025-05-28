# Waitlist Kit 🚀

*A one-click-deploy template that spins up a "Coming soon + Join the wait-list" page in minutes.*

![Screenshot of Waitlist Kit landing page](./public/og-waitlist-kit.png)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/charlieellington/waitlist-kit)

## Features

• **Next 14 App Router** – typed server actions, streaming, RSC.
• **Supabase** – Postgres, Auth (email magic-link), SQL migrations tracked in `supabase/migrations`.
• **Tailwind CSS + shadcn/ui** – no custom CSS.
• **Public wait-list view** – names only, never exposes email.
• **Magic-link auth** – optional sign-in to update your row.
• **Vercel × Supabase integration** – zero-config deploy.

## Quick start

```bash
# 1. Clone
npx create-next-app waitlist-kit -e https://github.com/charlieellington/waitlist-kit
cd waitlist-kit

# 2. Add env vars (rename env.example → .env.local)
cp env.example .env.local
# Paste your Supabase project URL & anon key

# 3. Run SQL migrations (automatic on Supabase cloud)
#    or manually:
supabase db push --file supabase/migrations/init.sql

# 4. Start dev server
pnpm dev
```

👉  Navigate to `http://localhost:3000` – you'll see the landing page, modal form, and public list.  

## Environment variables
See `env.example` for the minimal set:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# optional
SUPABASE_SERVICE_ROLE_KEY=
```

## Database schema
All migrations live in [`supabase/migrations/`](./supabase/migrations).  
Running `supabase db push` in CI will keep your cloud project in sync.

## Licence
MIT – see [`LICENSE`](./LICENSE). You are free to modify, distribute, and **sell** this template.  
The template itself re-uses MIT packages (Next.js, Supabase JS, Tailwind, shadcn/ui, etc.).

---
Built by Charlie Ellington – PRs & issues welcome!  
Follow the project roadmap in [`energy-flow/pages/03-projects/Waitlist-app/scratchpad-waitlist.md`](./energy-flow/pages/03-projects/Waitlist-app/scratchpad-waitlist.md).
