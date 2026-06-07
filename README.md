# TeacherShare Frontend (starter)

This is a minimal Next.js + TypeScript + Tailwind starter scaffold for the TeacherShare frontend.

Quick start:

```bash
npm install
npm run dev
```

Files added: basic pages, `Header` and `TopicForm` components, and Tailwind setup.

Next steps:
- Implement backend API and connect the create topic form to upload/presign endpoints.
- Add auth (NextAuth.js) and protected routes.
- Flesh out topic listing and teacher profile pages.

## Production Deployment & Email Sending

When you deploy the application to production:
- We use **Resend** (which is free, modern, and has a great free tier of 3,000 free emails per month) for email delivery.
- To configure email sending:
  1. Sign up for a free [Resend](https://resend.com) account.
  2. Copy your Resend API key.
  3. Add it to your environment variables on Vercel (or your hosting platform) as `RESEND_API_KEY`.
  4. (Optional) Once you verify a custom domain in Resend, set the `RESEND_FROM_EMAIL` environment variable (e.g. `TeacherShare <no-reply@yourdomain.com>`) to use it.
- The server will automatically detect this key and send real emails to your users' actual inboxes. If the key is not present (such as during local development), emails will fallback to being saved locally as HTML preview files in `public/emails`.

> [!IMPORTANT]
> **Resend Testing Domain Restriction (403 Error)**:
> When using the default `onboarding@resend.dev` testing address, Resend **only** allows sending emails to the **email address associated with your Resend account**.
> Sending to any other email (e.g. testing with a different Gmail address) will result in a `403` error in Resend.
> To resolve this:
> - **For Testing**: Make sure you sign up on your local TeacherShare app using the exact email address you used to create your Resend account.
> - **For Production**: Verify a custom domain in the Resend dashboard (under the **Domains** tab) and add the `RESEND_FROM_EMAIL` environment variable pointing to an email using your custom domain.
