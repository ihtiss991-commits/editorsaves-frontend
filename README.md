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
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<I will paste my Cloudflare Turnstile site key here>
TURNSTILE_SECRET_KEY=<I will paste my Cloudflare Turnstile secret here>
```

The Supabase service-role key is server-only. It is consumed by `src/lib/supabase-admin.ts`, imported only by the upload route. It must never be referenced from client components.

## Homepage integration

The supplied final homepage is preserved as trusted static HTML inside `src/components/HomePageClient.tsx`. Its CSS is moved verbatim into `src/app/globals.css`, and its original animation script is implemented in the client's `useEffect` with React-safe cleanup. The only intentional behavioral extension is that the upload interaction now performs the production Phase 1 workflow instead of only showing an alert: extension/size validation, Turnstile, POST `/api/upload`, success/error state, and secure storage.

The supplied homepage JSON-LD is preserved in a JSON-LD script block. Homepage visible content is not rewritten.

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
