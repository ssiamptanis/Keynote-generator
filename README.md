# GWI Keynote Generator

Turn a Google Doc into a keynote-style presentation. Paste a doc link, get a
GWI-branded slide deck back, viewable in-browser or exported to PDF. Every
generated deck is saved to a shared, org-wide library in Supabase.

Stack: Next.js 14 (App Router) on Render, Supabase (Postgres + Auth), Claude
(Anthropic API) for content generation.

## How it works

1. User signs in with a `@gwi.com` email (Supabase Auth magic link).
2. User pastes a Google Doc link on `/generate` (doc must be shared as
   "Anyone with the link can view" — the app fetches it via Google's public
   export endpoint, no OAuth needed).
3. The server extracts text + image URLs from the doc and sends them to
   Claude, which returns a structured slide-by-slide deck (JSON).
4. The deck is saved to the `presentations` table in Supabase and rendered
   with the GWI slide templates in `components/Slide.tsx`.
5. Anyone signed in can browse past decks on `/library`.

## Brand assets — live-synced with the design system repo

Colours, type, logo, icons, and illustrations all come from the real
design-system repo, [github.com/ssiamptanis/gwi-design-system](https://github.com/ssiamptanis/gwi-design-system),
at runtime — not a copy-pasted snapshot. When that repo goes through a brand
refresh, this app picks it up without a code change. `lib/designSystem.ts`
is where all of this lives; read the comments there for the full picture.

**How "live" it is** — two layers, cheapest first:

1. A GitHub webhook on `gwi-design-system` hits a Render deploy hook on
   every push (setup below). Render redeploys this app, which cold-starts
   its cache, so the very next request re-fetches everything fresh.
2. As a backstop in case a webhook delivery is ever missed, every fetch in
   `lib/designSystem.ts` also uses a 1-hour revalidate window, so the app
   self-heals within an hour even with zero webhook activity. This runs
   unauthenticated against the GitHub API (60 requests/hour per IP) — with
   this caching, actual usage is ~1-2 calls per redeploy/hour, nowhere near
   that limit. If you ever need more headroom, add a `GITHUB_TOKEN` env var
   and pass it as an `Authorization` header in `fetchTree()`.

**What's live vs. what's frozen per deck** — colours/fonts/type and the logo
apply globally and always reflect the current repo state, on every page,
including decks generated before a refresh. Icons and illustrations are
different: Claude resolves them to a specific file's URL at the moment a
deck is generated (`resolveSlideAssets` in `lib/claude.ts`), and that URL is
what's saved to the database — so a deck generated last month keeps
pointing at the exact asset it was built with, even if that file gets
renamed or removed in a later refresh. New decks always pick from whatever
icons/illustrations are live at generation time.

**Resilience** — if the live fetch to GitHub ever fails (outage, network
blip) or a brand refresh changes the file-naming convention badly enough
that nothing matches, `lib/designSystem.ts` falls back to a static snapshot
in `lib/designAssets.ts` rather than breaking the app. `app/globals.css`
also carries a full static copy of `colors_and_type.css` as a baseline —
the live version is injected on top of it and overrides matching values,
but if the live fetch fails, the app still looks correct using that
baseline instead of unstyled.

**Illustrations filtering** — the repo has 200+ illustration files across
~19 loosely organised folders, some seasonal (Christmas, Halloween) or
tied to a named individual — not appropriate for an arbitrary internal
deck. Rather than hand-curate an allowlist that goes stale, `lib/designSystem.ts`
auto-includes every illustration EXCEPT ones matching a small keyword
blocklist (`ILLUSTRATION_BLOCKLIST`). New illustrations the design team adds
show up automatically; if a new one is clearly unsuitable for general use,
add a keyword to that list.

### Setting up the webhook (instant refresh)

1. **Render**: open the `gwi-keynote-generator` service > Settings > Deploy
   Hook. Copy the URL it gives you.
2. **GitHub**: on the `gwi-design-system` repo > Settings > Webhooks > Add
   webhook. Paste the Render deploy hook URL as the Payload URL, content
   type `application/json`, and leave the trigger on "Just the push event."
3. Save. Every push to `gwi-design-system`'s default branch now triggers a
   redeploy of this app.

This means a brand refresh pushed to that repo shows up here within the
time it takes Render to rebuild and redeploy (typically a couple of
minutes) — no one has to touch this app's code or repo at all.

## One-time setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Project Settings > API — copy the **Project URL** and **anon public**
   key (and, optionally, the service role key).
3. SQL Editor > New query — paste and run `supabase/schema.sql`. This
   creates the `presentations` table and its row-level security policies.
4. Authentication > Providers — Email should already be on. Authentication
   > Email Templates can be left as default (magic link).
5. Authentication > URL Configuration — set:
   - **Site URL**: your Render URL, e.g. `https://gwi-keynote-generator.onrender.com`
   - **Redirect URLs**: add both `http://localhost:3000/auth/callback` (for
     local dev) and `https://<your-render-url>/auth/callback`.

Access is restricted in two layers: the RLS policies in `schema.sql` only
let `@gwi.com` emails read/write, and `middleware.ts` signs out + redirects
anyone who isn't on that domain. Change `gwi.com` in both places (and the
`ALLOWED_EMAIL_DOMAIN` env var) if you ever fork this for another org.

### 2. Anthropic API key

Create a key at [console.anthropic.com](https://console.anthropic.com) and
keep it handy for the env vars below.

### 3. Environment variables

Copy `.env.example` to `.env.local` for local dev and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` — from Supabase (not currently used by the app,
  but useful to have for future admin scripts; keep it secret).
- `ANTHROPIC_API_KEY` — from Anthropic.
- `ALLOWED_EMAIL_DOMAIN` — defaults to `gwi.com`.

### 4. Push to GitHub

This was built against the empty repo at
`https://github.com/ssiamptanis/Keynote-generator`. From this folder:

```bash
cd keynote-generator
git init
git remote add origin https://github.com/ssiamptanis/Keynote-generator.git
git add .
git commit -m "Initial keynote generator app"
git branch -M main
git push -u origin main
```

### 5. Deploy to Render

Option A — Blueprint (uses the included `render.yaml`):

1. Render dashboard > New > Blueprint, connect the GitHub repo.
2. Render reads `render.yaml` and creates the web service automatically.
3. Fill in the env vars marked `sync: false` in the Render dashboard
   (Supabase URL/keys, Anthropic key) — same values as `.env.local`.

Option B — Manual web service:

1. Render dashboard > New > Web Service, connect the repo.
2. Runtime: Node. Build command: `npm install && npm run build`. Start
   command: `npm run start`.
3. Add the same environment variables as above.

Once deployed, go back to Supabase Auth URL Configuration and make sure the
Render URL is set as the Site URL / redirect URL (step 1.5 above).

## Local development

```bash
cd keynote-generator
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```

Visit `http://localhost:3000`.

## Notes and limitations

- **Google Docs**: only works on docs shared as "Anyone with the link can
  view". Private docs will return a clear error rather than partial content.
  If you need this to work on private docs, swap `lib/googleDoc.ts` for a
  proper Google OAuth + Docs API integration.
- **Images**: image URLs come straight from Google's export HTML. These can
  be short-lived in some cases — if an image looks broken in an older saved
  deck, regenerate.
- **Auth**: uses Supabase's passwordless magic-link email, not Google SSO.
  Swap in a Google OAuth provider in Supabase Auth settings if you'd rather
  use gwi.com Google Workspace sign-in.
