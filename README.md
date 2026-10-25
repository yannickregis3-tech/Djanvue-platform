# DJANVUƐ — Social platform

Frontend built with React, TypeScript and Vite. Backend: Supabase Auth and PostgreSQL with Row Level Security.

## Local development
1. Install Node.js 20.19+ or 22.12+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and set the Supabase URL and publishable key.
4. Run `npm run dev`; run `npm run build` before shipping.

Never place a Supabase service-role key in browser variables. Use only the publishable key in the frontend; enforce access with database RLS.

## Current scope
- Responsive light UI for desktop and mobile.
- Supabase email/password sign-up and sign-in.
- Authenticated text-post creation stored in Supabase.
- Example feed content is demo data until live feed queries are completed.
- Communities and notification panels are interface previews for the next phase.

## Roadmap
1. Complete profile onboarding, RLS review and integration tests.
2. Live feed, likes, comments, follows and privacy behavior.
3. Community membership and notifications.
4. Cloudflare R2 media adapter, moderation and end-to-end tests.
