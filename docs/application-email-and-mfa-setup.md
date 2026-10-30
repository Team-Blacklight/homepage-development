# Team Blacklight application email and two-step sign-in setup

## 1. Configure the application decision email function

The website calls the Supabase Edge Function `review-application` when an admin or overseer selects **Accepted** or **Declined** and presses **EMAIL DECISION & REMOVE**. The function checks the caller's authenticated user and protected `profiles.role`, sends the matching email, and deletes the application only after the email provider accepts the message. Failed sends leave the application in the inbox.

1. Create a Resend account and verify a sending domain/address. Do not use an unverified sender address.
2. In the Supabase project dashboard, open **Edge Functions** and deploy the function at `supabase/functions/review-application/index.ts`. Alternatively, deploy with the Supabase CLI from the repository root:
   ```sh
   supabase functions deploy review-application
   ```
3. Set these function secrets in the Supabase dashboard (Edge Functions → Secrets), or with the CLI:
   ```sh
   supabase secrets set RESEND_API_KEY=re_... EMAIL_FROM="Team Blacklight <verified-sender@your-domain>" SITE_URL="https://your-actual-site-domain"
   ```
   Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY` (or `SUPABASE_PUBLISHABLE_KEY`) and `SUPABASE_SERVICE_ROLE_KEY` to deployed functions in its environment. If your project does not expose one automatically, configure it as a secret using the value from Project Settings → API. Never put a service-role key or Resend key in website JavaScript.
4. Replace the example `SITE_URL` with the actual public site origin. The acceptance button points to a URL containing a random, one-time staff invitation token.
5. Test with a controlled application and an authorized admin/overseer account. Confirm a successful email removes the row; an invalid provider key or unverified sender should leave the row available for retry.

Accepted applications now receive a secure, random, single-use staff invitation token (not a browser cookie or password). The invitation is bound to the applicant's email and expires after seven days. The token is stored only as a SHA-256 hash in `staff_invites`; the original token appears in the email link.

### Staff invitation setup (required)

1. Run `staff-invitations.sql` in the Supabase SQL Editor. This adds `profiles.account_type` (default `customer`), the private `staff_invites` table, and an atomic one-time redemption function.
2. Deploy the redemption Edge Function:
   ```sh
   supabase functions deploy redeem-staff-invite
   ```
3. Redeploy the updated decision email function:
   ```sh
   supabase functions deploy review-application
   ```
4. The same Supabase project secrets listed above are used by both functions.
5. Test acceptance using an address you control. Create the account with the exact invited email, verify the email, complete TOTP setup, and confirm the account page displays **TEAM BLACKLIGHT STAFF**. Try the link again and confirm it cannot be redeemed twice.

New ordinary registrations receive `account_type = 'customer'` by default. The invitation changes only the invited account's account type to `staff`; it does not grant admin or overseer privileges. Those elevated roles remain separately managed by authorized Team Blacklight administrators.

## 2. Two-step sign-in (TOTP)

The member-access UI uses Supabase Auth MFA with a TOTP authenticator app. On first sign-in, the account is prompted to scan a QR code (or enter the displayed manual key) and verify a six-digit code. Subsequent sign-ins require a fresh code. Staff console rendering is gated on Supabase's `aal2` assurance level as well as the existing admin/overseer role.

Before rollout, check the Supabase dashboard's **Authentication → Settings / Multi-Factor Authentication** options and ensure TOTP is enabled. Test with a non-admin account first, then test staff access. Users should save their authenticator setup securely and retain any recovery options supported by the project. Do not share the displayed manual setup key.

## Operational notes

- Email delivery depends on a verified sender domain and valid Resend API key; repository commits alone cannot configure those external services.
- The email provider's accepted response means it accepted the message for delivery, not that the recipient's mailbox definitely received it.
- If the email sends but the database delete fails, the function reports that exact state. Check the inbox before retrying so the applicant does not receive a duplicate.
- The function requires the caller's JWT and rechecks the caller's role server-side; hiding the button in the browser is not the security boundary.
