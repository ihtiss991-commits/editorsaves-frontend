# EditorSaves

EditorSaves is a Next.js 14 App Router project for Phase 1 of a universal game-save editor: upload supported save files, verify the upload with Cloudflare Turnstile, store the file privately in Supabase Storage, and record upload metadata in Supabase Postgres.

## Stack

- Next.js 14 + App Router
- TypeScript
- React 18
- Supabase Storage + Postgres
- Cloudflare Turnstile
- CSS design system extracted from the supplied final homepage HTML

## Environment variables

Create `.env.local` from `.env.local.example`. Never commit the real file.

```text
NEXT_PUBLIC_SUPABASE_URL=https://vtqwmnzojiczpdedpked.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

The Supabase service-role key is server-only. It is consumed by `src/lib/supabase-admin.ts`, imported only by the upload route. It must never be referenced from client components.

## Homepage integration

The supplied standalone homepage markup is server-rendered from `src/components/HomePageClient.tsx`. Its light-premium stylesheet is isolated in `src/app/homepage.css`, while the shared design tokens, navigation, footer, and secondary routes use the matching light theme in `src/app/globals.css`. Inter and Space Grotesk are loaded through `next/font`.

The upload field is connected to the existing `POST /api/upload` route. It validates supported extensions and the 25 MB size limit in the browser, requires Cloudflare Turnstile verification, and then submits `file`, `turnstileToken`, and the optional empty `gameTitle` field expected by the server route. Backend server-side validation remains in place. The updated `supabase/schema.sql` includes the metadata columns used by that route.

Homepage metadata and JSON-LD live in `src/app/page.tsx`, so there is no duplicate schema in raw HTML. The schema has no placeholder social profiles and no SearchAction because this repository has no `/search` route. The public copy supplied in the HTML is retained apart from adding the upload status/security controls and updating the structured data as requested.

## Supabase setup

Run `supabase/schema.sql` in the Supabase SQL Editor. It creates the `uploads` table, enables RLS, creates a service-role-only policy, and creates the private `save-files` Storage bucket with service-role Storage policy.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Type checking / production build

```bash
npm run typecheck
npm run build
npm run start
```

## Vercel

1. Push this folder to GitHub.
2. Import the repository into Vercel.
3. Add all five environment variables in Project Settings → Environment Variables.
4. Add your production domain `editorsaves.com` and configure its DNS.
5. Add the production domain to your Cloudflare Turnstile site configuration.
6. Redeploy.

## Upload contract

`POST /api/upload` expects multipart form data with:

- `file`: the save file
- `turnstileToken`: Cloudflare Turnstile token

The route checks request size, file presence, empty files, 25 MB maximum size, extension whitelist, Turnstile verification, then stores the file at `{uuid}/{safe-original-filename}` and records the upload metadata. If the database insert fails after Storage succeeds, the route attempts to remove the orphaned Storage object.

## Contact form

The contact page uses a native `mailto:` form so it does not require another service key. The form opens the visitor's default mail client with the entered fields. Replace the destination address in `src/app/contact/page.tsx` with the project's actual support mailbox when that mailbox is finalized.

## Routes

- `/`
- `/blog`
- `/about`
- `/privacy`
- `/terms`
- `/contact`
- `/sitemap.xml`
- `/robots.txt`

## Homepage theme and launch assets

The homepage uses the supplied light-premium design with Inter and Space Grotesk fonts. The image assets referenced by Open Graph and Organization JSON-LD are included at `public/og-image.jpg` and `public/logo.png`; replace these files at those same paths if you later supply final brand artwork.

Before deploying uploads, set these environment variables in Vercel (Production, Preview, and Development as appropriate):

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (if required by your client setup)
- `SUPABASE_SERVICE_ROLE_KEY`

The upload form intentionally continues to POST to the existing `/api/upload` route and expects the existing `uploads` table plus the `save-files` Supabase Storage bucket described in `supabase/schema.sql`. The standalone homepage has no search route, so the WebSite SearchAction schema is omitted. `datePublished` and `dateModified` are set to 2026-10-20 for this homepage update; change `datePublished` if the actual public launch date differs.
