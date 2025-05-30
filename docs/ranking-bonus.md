# Waitlist Ranking Bonus

This template includes an optional "move-up" mechanic that encourages users to complete their profile (photo + reason).

## How it works

1.  A nullable `rank INTEGER` column sits on `waitlist_signups`.
2.  The public list orders by `rank` **ascending** ( `NULLS LAST` ), then by `created_at`.
3.  When a logged-in user uploads a photo *or* adds a reason the server:
    * fetches the current **minimum** `rank` (ignores NULLs)
    * updates the user's own row to `min_rank − 1` (or `0` if none exist)
4.  Because it only touches the user's row the update is allowed by the default RLS "owner can UPDATE" policy – no service-role key required.

This yields deterministic ordering (each promotion floats higher) while keeping the template zero-config.

## Customising behaviour

*Change the amount they move up?*

Adjust the logic in `app/api/profile/promote/route.ts`. The default rule is:

```
< 10 rows  →  1 place up (one promotion)
< 100 rows →  5 places up (two promotions = 10)
≥ 100 rows → 10 places up (three promotions = 30)
```

Since we now decrement `rank` by 1 at each promotion, these numbers map to **how many times you invite the user to act** (photo, reason, etc.).

*Prefer exact positional shifts (real index numbers)?*

Supply a `SUPABASE_SERVICE_ROLE_KEY` env var then swap the simplified `promote` handler with the commented "strict re-rank" version (in the same file). That version re-indexes affected rows and keeps `rank` values dense (0,1,2...). 