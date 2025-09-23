# 📖 Configure Resend for Trellone Emails

## 1) Sign Up and Verify a Sender

- Go to https://resend.com → Sign up / Log in
- Add and verify a sender domain or email (Resend → Senders)

---

## 2) Create an API Key

- Resend → API Keys → Create API Key

---

## 3) Set Environment Variables

---

Add to `.env.{environment}`:

```env
RESEND_API_KEY=re_1234567890abcdefghijklmnopqrstuv
RESEND_EMAIL_FROM_ADDRESS='Trellone' <no-reply@your-domain.com>
```

---

The API uses `RESEND_EMAIL_FROM_ADDRESS` as the sender and will embed links to `CLIENT_URL` in email templates.

---

## 4) What the Backend Sends

Trellone API sends the following email types via Resend:

- Verify registration email
- Forgot password email
- Workspace invitation
- Board invitation

Templates are in `src/templates/*.html` and are populated with dynamic links.

---

🔑 Best Practices

- Keep the key secret; never expose to the browser
- Use separate keys per environment
- Ensure the sender domain is verified in Resend
