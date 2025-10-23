# 📖 Deploy Trellone API to Render

This guide deploys the Trellone API (Node/Express/TypeScript) to Render as a Web Service. It uses environment-specific `.env` files and connects to MongoDB Atlas.

## 1) Create a Web Service

- Go to Render Dashboard: https://render.com
- New → Web Service
- Connect your Git provider
- Select repository: `trellone-server`
- Branch: `main`

## 2) Service Configuration

- Name: `trellone-server` (or your preference)
- Environment: `Node`
- Build Command:

```bash
npm install; npm run build
```

- Start Command (staging):

```bash
npm run start:stage
```

Render will set the working directory to the repo root. The server expects `.env.staging` at runtime.

## 3) Environment Variables

Add the variables from `.env.example` in the Render dashboard under Settings → Environment. Recommended staging values:

- `NODE_ENV=staging`
- `HOST=https://your-domain-api.onrender.com`
- `PORT=8000`
- `CLIENT_URL=https://your-domain.com`
- `GOOGLE_REDIRECT_URI=https://your-domain-api.onrender.com/auth/oauth/google`
- `CLIENT_REDIRECT_CALLBACK=https://your-domain.com/login/oauth`
- MongoDB Atlas: `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`
- JWT & security: `PASSWORD_SECRET`, `JWT_SECRET_*`, `*_EXPIRES_IN`
- Email: `RESEND_API_KEY`, `RESEND_EMAIL_FROM_ADDRESS` (e.g. `'Trellone' <no-reply@your-domain.com>`)
- UploadThing: `UPLOADTHING_TOKEN`
- Unsplash: `UNSPLASH_ACCESS_KEY` (secret/app id optional)

Tip: Keep production values in `.env.production` and set `Start Command` to `npm run start:prod` with `NODE_ENV=production` if you create a prod service.

## 4) MongoDB Atlas Network Access (Important)

Your Render service connects to Atlas from Render egress IPs. In Atlas → Network Access, add Render's outbound IP(s) for your service. Without this, DB connections will fail.

Steps:

1. In Render service → Settings, find Outbound IP addresses
2. In Atlas → Network Access → Add IP Address
3. Add all Render IPs and save

## 5) Deploy

- Click Create Web Service → Render builds using your Build Command
- On success, service is accessible at `https://your-domain-api.onrender.com`
- Verify endpoints (e.g. `GET /auth/oauth/google` will redirect after successful OAuth)

## 6) Notes

- Health checks: none required by the app
- CORS: whitelist includes `CLIENT_URL` and `GOOGLE_REDIRECT_URI`; ensure these envs are correct
- Email links in templates use `CLIENT_URL`
