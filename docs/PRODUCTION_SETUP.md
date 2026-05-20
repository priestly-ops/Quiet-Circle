# Quiet Circle Production Setup

## Required Environment Variables

```env
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-2.0-flash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Deploy Steps

1. Add variables in Vercel.
2. Redeploy latest production deployment.
3. Run Supabase SQL migration from `supabase/migrations/2026_05_quiet_circle_security.sql`.
4. Enable Realtime for `room_messages`.
5. Enable Email + Google authentication providers.

## Production Rules

- Do not run without Supabase in production.
- Do not expose service role keys to frontend.
- Enable rate limits in Vercel.
- Review moderation queue daily.
- Keep AI fallback enabled for provider outages.
