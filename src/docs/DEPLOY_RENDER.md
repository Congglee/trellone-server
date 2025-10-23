# 📖 Deploy Trellone API to Render

This guide deploys the Trellone API (Node/Express/TypeScript) to Render as a Web Service. It uses environment-specific `.env` files and connects to MongoDB Atlas. You can deploy any environment on Render (development, staging, or production), and the free tier can be used to get started at no cost.

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

- Start Command (choose per environment):

```bash
# Development
npm run start:dev

# Staging
npm run start:stage

# Production
npm run start:prod
```

Render will set the working directory to the repo root. The server reads `.env.{NODE_ENV}` at runtime (e.g., `.env.development`, `.env.staging`, `.env.production`).

## 3) Environment Variables

Add the variables from `.env.example` in the Render dashboard under Settings → Environment. Recommended values depend on your target environment:

- For development (optional when using Render free tier):

  - `NODE_ENV=development`
  - `HOST=https://your-dev-service.onrender.com`
  - `PORT=8000`
  - `CLIENT_URL=https://your-dev-domain.com`
  - `GOOGLE_REDIRECT_URI=https://your-dev-service.onrender.com/auth/oauth/google`
  - `CLIENT_REDIRECT_CALLBACK=https://your-dev-domain.com/login/oauth`

- For staging:

  - `NODE_ENV=staging`
  - `HOST=https://your-stage-service.onrender.com`
  - `PORT=8000`
  - `CLIENT_URL=https://your-stage-domain.com`
  - `GOOGLE_REDIRECT_URI=https://your-stage-service.onrender.com/auth/oauth/google`
  - `CLIENT_REDIRECT_CALLBACK=https://your-stage-domain.com/login/oauth`

- For production:
  - `NODE_ENV=production`
  - `HOST=https://api.yourdomain.com`
  - `PORT=8000`
  - `CLIENT_URL=https://yourdomain.com`
  - `GOOGLE_REDIRECT_URI=https://api.yourdomain.com/auth/oauth/google`
  - `CLIENT_REDIRECT_CALLBACK=https://yourdomain.com/login/oauth`
- MongoDB Atlas: `DB_NAME`, `DB_URI`
- JWT & security: `PASSWORD_SECRET`, `JWT_SECRET_*`, `*_EXPIRES_IN`
- Email: `RESEND_API_KEY`, `RESEND_EMAIL_FROM_ADDRESS` (e.g. `'Trellone' <no-reply@your-domain.com>`)
- UploadThing: `UPLOADTHING_TOKEN`
- Unsplash: `UNSPLASH_ACCESS_KEY` (secret/app id optional)

Tip: Keep values in the corresponding `.env.{environment}` file and set the `Start Command` accordingly (`start:dev`, `start:stage`, or `start:prod`).

## 4) MongoDB Atlas Network Access (Important)

Your Render service connects to Atlas from Render egress IPs. In Atlas → Network Access, add Render's outbound IP(s) for your service. Without this, DB connections will fail.

Steps:

1. In Render service → Settings, find Outbound IP addresses
2. In Atlas → Network Access → Add IP Address
3. Add all Render IPs and save

## 5) Deploy (Free tier supported)

- Click Create Web Service → Render builds using your Build Command
- On success, the service is accessible at your Render domain (e.g., `https://your-service.onrender.com`). The free tier is sufficient for testing and small projects.
- Verify endpoints (e.g., `GET /auth/oauth/google` will redirect after successful OAuth)

## 6) Notes

- Health checks: none required by the app
- CORS: whitelist includes `CLIENT_URL` and `GOOGLE_REDIRECT_URI`; ensure these envs are correct
- Email links in templates use `CLIENT_URL`
