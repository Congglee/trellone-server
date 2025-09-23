# 📖 Configure Google OAuth for Trellone API

This guide configures Google OAuth for Trellone. The backend endpoint that handles the OAuth callback is:

- `GET /auth/oauth/google`

After exchanging the authorization code, the server will set `access_token` and `refresh_token` cookies and redirect to `CLIENT_REDIRECT_CALLBACK` with tokens also appended as query string (used by the Trellone frontend).

## 1) Create a Google Cloud Project

1. Open Google Cloud Console: https://console.cloud.google.com
2. Create a new project (IAM & Admin → Create Project)
3. Ensure billing is enabled if Google requires it

## 2) Configure OAuth Consent Screen

- APIs & Services → OAuth consent screen
- User type: External (typical for public apps)
- App name, support email, developer contact email
- Scopes: request only basic profile/email scopes (e.g. `email`, `profile`)
- Add test users during development if the app is not verified yet

## 3) Create OAuth Client (Web application)

APIs & Services → Credentials → Create Credentials → OAuth client ID → Web application:

- Authorized JavaScript origins (example):

  - Development: `http://localhost:3000`
  - Staging: `https://your-domain.com`
  - Production: `https://your-domain.com`

- Authorized redirect URIs (must match backend callback):
  - Development: `http://localhost:8000/auth/oauth/google`
  - Staging: `https://your-domain-api.onrender.com/auth/oauth/google`
  - Production: `https://your-domain-api.onrender.com/auth/oauth/google`

Save the created Client ID and Client Secret.

## 4) Backend Environment Variables

Set the following in `.env.{environment}`:

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/oauth/google
CLIENT_REDIRECT_CALLBACK=http://localhost:3000/login/oauth
```

For staging/production, replace the URLs accordingly.

## 5) Flow Summary

1. Frontend redirects user to Google with your `GOOGLE_CLIENT_ID`, requesting code
2. Google redirects back to `GOOGLE_REDIRECT_URI` with `?code=...`
3. Trellone API exchanges code → issues JWTs
4. API sets `access_token` and `refresh_token` cookies and redirects to `CLIENT_REDIRECT_CALLBACK` with tokens in query string
5. Frontend completes login
