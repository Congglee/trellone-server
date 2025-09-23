# Trellone API Server 🚀

<p align="center">
  <img src="https://raw.githubusercontent.com/Congglee/trellone-app/main/public/og.png" alt="Trellone Preview" width="640" />
</p>

Trellone is a Kanban-style project management platform inspired by Trello. This repository contains the backend API built with Node.js, Express, TypeScript, MongoDB, and Socket.IO — powering the Trellone web app.

### Key Features ✨

- Authentication and authorization: email/password, email verification, JWT, Google OAuth
- Role- and permission-based access control for workspaces, boards, columns, and cards
- Real-time events with Socket.IO (boards, cards, invitations, workspaces)
- File uploads (images/documents) via UploadThing
- Email delivery (verification, password reset, invitations) via Resend
- Unsplash integration for cover photos
- Production-ready configuration (CORS, environment-based config, Docker, PM2)

### Tech Stack 🧰

- **Node.js + Express**: HTTP server and routing
- **TypeScript**: type safety and maintainability
- **MongoDB (Atlas)**: document database
- **Socket.IO**: real-time communication
- **Resend**: transactional emails
- **UploadThing**: file uploads and storage
- **Unsplash API**: image search and covers
- **PM2**: production process manager (in Docker)

### Frontend Repository 🔗

- Trellone App (React + MUI): https://github.com/Congglee/trellone-app

## Getting Started 🏁

### Requirements 🧪

- Node.js 18+ (20+ recommended)
- npm

### Installation 📦

```bash
npm install
```

Create environment files at the project root. The server reads `.env.{NODE_ENV}` (required):

- `.env.development`
- `.env.staging`
- `.env.production`

Tip: start with `.env.example` below and copy to your target `.env.*` file.

### Run in Development 🧑‍💻

```bash
# Start with auto-reload
npm run dev
```

Server runs at `http://localhost:8000` by default.

### Build & Start ⚙️

```bash
# Build TypeScript -> dist/
npm run build

# Start compiled app for a given environment
npm run start:dev   # NODE_ENV=development
npm run start:stag  # NODE_ENV=staging
npm run start:prod  # NODE_ENV=production
```

### Linting & Formatting 🧹

```bash
npm run lint
npm run lint:fix
npm run prettier
npm run prettier:fix
```

## Environment Variables (.env.example) 🔑

Copy the following into your `.env.{environment}` file and fill in values as appropriate.

```env
PORT=8000

HOST='http://localhost'

DB_NAME=''
DB_USERNAME=''
DB_PASSWORD=''

DB_WORKSPACES_COLLECTION="workspaces"
DB_BOARDS_COLLECTION='boards'
DB_COLUMNS_COLLECTION='columns'
DB_CARDS_COLLECTION='cards'
DB_USERS_COLLECTION='users'
DB_REFRESH_TOKENS_COLLECTION='refresh_tokens'
DB_INVITATIONS_COLLECTION='invitations'

PASSWORD_SECRET=''

JWT_SECRET_ACCESS_TOKEN=''
JWT_SECRET_REFRESH_TOKEN=''
JWT_SECRET_EMAIL_VERIFY_TOKEN=''
JWT_SECRET_FORGOT_PASSWORD_TOKEN=''
JWT_SECRET_INVITE_TOKEN=''

ACCESS_TOKEN_EXPIRES_IN=''
REFRESH_TOKEN_EXPIRES_IN=''
EMAIL_VERIFY_TOKEN_EXPIRES_IN=''
FORGOT_PASSWORD_TOKEN_EXPIRES_IN=''
INVITE_TOKEN_EXPIRES_IN=''

CLIENT_URL='http://localhost:3000'

GOOGLE_CLIENT_ID=''
GOOGLE_CLIENT_SECRET=''
GOOGLE_REDIRECT_URI=''
CLIENT_REDIRECT_CALLBACK=''

RESEND_API_KEY=''
RESEND_EMAIL_FROM_ADDRESS=''

UPLOADTHING_TOKEN=''

UNSPLASH_ACCESS_KEY=''
UNSPLASH_SECRET_KEY=''
UNSPLASH_APPLICATION_ID=''
```

## Configuration: Environments & URLs 🌐

- API base URLs

  - Development: `http://localhost:8000`
  - Staging: `https://yourdomain-api.onrender.com`
  - Production: `https://api.yourdomain.com`

- Client URLs
  - Development: `http://localhost:3000`
  - Staging: `https://yourdomain.com`
  - Production: `https://yourdomain.com`

CORS is enabled with environment awareness and a whitelist that includes the client app and Google OAuth redirect URL.

## Routing Overview 🧭

- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh-token`
- `POST /auth/verify-email`, `POST /auth/resend-verify-email`
- `POST /auth/forgot-password`, `POST /auth/verify-forgot-password`, `POST /auth/reset-password`
- `GET /auth/oauth/google`
- `GET /users/me`, `PATCH /users/me`, `PUT /users/change-password`
- Workspaces: CRUD, membership, guests, and board-join flows under `/workspaces`
- Boards: CRUD, membership, and permissions under `/boards`
- Columns: CRUD under `/columns`
- Cards: CRUD, comments, reactions, attachments, member management under `/cards`
- Invitations: workspace/board invites under `/invitations`
- Medias: uploads and Unsplash search under `/medias`

Note: API documentation will be added in the future.

## Email, Files, and Media ✉️📎🖼️

- Emails are sent via Resend using HTML templates in `src/templates`.
- File uploads are handled via UploadThing.
- Unsplash is used for image search/cover photos.

## Deploy 🚢

### Render (Staging)

- Staging API is deployed on Render. Ensure MongoDB Atlas Network Access includes Render outbound IPs.
- Build Command:
  ```bash
  npm install; npm run build
  ```
- Start Command (staging):
  ```bash
  npm run start:stag
  ```
- Configure environment variables in Render dashboard.

### Docker

Build and run using the provided multi-stage Dockerfile (PM2 runtime inside):

```bash
# Build image
docker build -t trellone-server .

# Run container (example for production env)
docker run -d \
  --name trellone-server \
  -p 8000:8000 \
  -e NODE_ENV=production \
  -v $(pwd)/uploads:/home/node/app/uploads \
  --env-file .env.production \
  trellone-server
```

The image runs `pm2-runtime` with the script defined in `ecosystem.config.js`. Upload directories are created at runtime; mounting a volume for `uploads/` is recommended.

## Project Structure (Simplified) 🗂️

```text
📦trellone-server
 ┣ 📂src
 ┃ ┣ 📜index.ts               # entry: DB connect, start server
 ┃ ┣ 📜app.ts                 # express app, routes, middlewares, sockets
 ┃ ┣ 📂config                 # environment, cors, logger, dir
 ┃ ┣ 📂constants              # constants
 ┃ ┣ 📂routes                 # auth, users, workspaces, boards, columns, cards, medias, invitations
 ┃ ┣ 📂controllers            # route handlers
 ┃ ┣ 📂middlewares            # validators, RBAC, error handler
 ┃ ┣ 📂services               # database, domain services
 ┃ ┣ 📂sockets                # socket event wiring
 ┃ ┣ 📂models                 # schemas and request types
 ┃ ┣ 📂providers              # services for external integrations
 ┃ ┣ 📂templates              # email HTML templates
 ┃ ┣ 📂utils                  # helpers (jwt, file, handlers, etc.)
 ┃ ┣ 📂docs                   # documentation
 ┣ 📜Dockerfile
 ┣ 📜ecosystem.config.js
```

## Troubleshooting 🧯

- 401/CORS issues: confirm `CLIENT_URL`, Google redirect URI, and CORS whitelist.
- MongoDB connection errors: verify Atlas credentials, database name, and Network Access (IP allowlist).
- Email not delivered: check Resend API key and verified sender address.
- Upload failures: ensure `UPLOADTHING_TOKEN` and mounted `uploads/` volume when running Docker.

## Contributing 🤝

PRs are welcome! Open an issue for bugs or feature proposals.

## License 📜

Open source, free to use — no license.
