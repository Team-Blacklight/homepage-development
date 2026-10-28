# Team Blacklight — Homepage Development

The Team Blacklight public website, member account UI, staff console, project/store listings, and application intake portal.

## Application decisions and sign-in security

- The staff application inbox sends Accepted/Declined decision emails through the Supabase Edge Function `review-application`.
- A submission is removed from the inbox only after the email provider accepts the message.
- Member sign-in requires Supabase TOTP authenticator verification (two-step verification); staff console access additionally checks the authenticated user's MFA assurance level and protected role.

**Deployment/configuration is required:** the Edge Function must be deployed to the connected Supabase project, and its Resend sender/API key and actual website URL must be configured as server-side secrets. See [Application email and MFA setup](docs/application-email-and-mfa-setup.md). Do not put service-role keys or email-provider secrets in browser code.
