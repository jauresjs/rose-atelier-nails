# Supabase authentication

Authentication uses Supabase with server-side PKCE and HttpOnly session cookies. The app validates account sessions with `getUser()`. An installed guest can generate one preview; further generation, private gallery access and official downloads require registration. No service-role key is required by the application.

## Environment

Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` (a Supabase publishable key is supported). Local values are in ignored `.env.local`; hosted values are managed through Sites. The supplied `NEXT_PUBLIC_*` names were mapped to these SvelteKit server environment names. Callback origins come from the actual request, not the supplied localhost app URL.

## Supabase dashboard

Project: https://supabase.com/dashboard/project/dgdaxujzcagrnzhpufuk

- Set Authentication → URL Configuration → Site URL to `https://rose-atelier-nails.gtty852.chatgpt.site`.
- Allow these exact redirect URLs:
  - `https://rose-atelier-nails.gtty852.chatgpt.site/auth/callback`
- For local testing, add equivalent URLs for the development server's actual origin.
- Enable Google in Authentication → Sign In / Providers and enter the Google OAuth web client ID and secret.
- In Google Cloud's OAuth web client, add the app origin as an authorized JavaScript origin and `https://dgdaxujzcagrnzhpufuk.supabase.co/auth/v1/callback` as an authorized redirect URI.
- If Google's OAuth app is still in testing mode, add the intended testers to its audience.
- Email/password is already enabled with email confirmation required.

The login screen checks Supabase provider settings whenever it opens. The Google button becomes available after the provider is enabled; no deployment is needed for that change.

## Email links

The default PKCE email links must be opened in the same browser that requested them. For confirmations that work in a different browser, use Supabase email templates pointing to the token-hash confirmation route:

Confirmation template link:
`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`

Recovery template link:
`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`

Configure custom SMTP in Supabase for delivery to real testers. Supabase's built-in email service has restrictions and is intended for initial testing. Do not disable email confirmation just to bypass delivery configuration.

## Gallery ownership

Gallery metadata and images remain in the existing D1 and R2 storage. Ownership is the verified Supabase user ID, checked server-side for every list and image request. Signing in claims the existing anonymous gallery for that browser and removes its anonymous cookie after a successful transfer. No Supabase public tables, grants, or RLS policies are added by this auth-only integration.

Sign out revokes the current Supabase session and removes session/preview cookies. Preview job signatures include the user ID to prevent another account from retrieving the previous account's job on a shared browser.

The app's Supabase login is separate from the Sites hosting audience. Public voting requires public Sites access. See SHARING_AND_PLANS.md for guest limits, public poll visibility, and Premium entitlements.
