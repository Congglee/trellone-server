# Config - Agent Guide

## Package Identity

Configuration layer for Trellone API. Environment variable validation, CORS setup, logging configuration, rate limiting, and directory paths.

## Setup & Run

Config modules are imported and used throughout the application. No separate build step needed.

```typescript
import { envConfig, environment } from '~/config/environment'
import { corsOptions } from '~/config/cors'
import logger from '~/config/logger'
import { limiter } from '~/config/rate-limit'
```

## Patterns & Conventions

### File Organization

- **Environment**: `src/config/environment.ts` - Environment variable validation
- **CORS**: `src/config/cors.ts` - CORS policy configuration
- **Logger**: `src/config/logger.ts` - Logging setup (chalk-based)
- **Directories**: `src/config/dir.ts` - Directory path constants
- **Rate Limit**: `src/config/rate-limit.ts` - Rate limiting configuration

✅ **DO**: Follow `src/config/environment.ts` pattern

- Load environment-specific `.env` files
- Validate required environment variables
- Export validated config object

### Environment Configuration

✅ **DO**: Load environment-specific files based on NODE_ENV

```typescript
// config/environment.ts
import fs from 'fs'
import path from 'path'
import logger from '~/config/logger'
import { config } from 'dotenv'

const env = process.env.NODE_ENV
const envFilename = `.env.${env}`

if (!env) {
  logger.error('You have not provided the NODE_ENV variable.')
  process.exit(1)
}

logger.info(`Detect NODE_ENV = ${env}, so the app will use ${envFilename} file`)

if (!fs.existsSync(path.resolve(envFilename))) {
  logger.error(`File ${envFilename} does not exist`)
  process.exit(1)
}

config({ path: envFilename })

export const environment = process.env.NODE_ENV || 'development'
```

✅ **DO**: Export validated config object

```typescript
export const envConfig = {
  // Server
  port: (process.env.PORT as string) || '8000',
  host: (process.env.HOST as string) || 'http://localhost',

  // Database
  dbName: process.env.DB_NAME as string,
  dbUri: process.env.DB_URI as string,
  dbWorkspacesCollection: process.env.DB_WORKSPACES_COLLECTION as string,
  dbBoardsCollection: process.env.DB_BOARDS_COLLECTION as string,
  dbColumnsCollection: process.env.DB_COLUMNS_COLLECTION as string,
  dbCardsCollection: process.env.DB_CARDS_COLLECTION as string,
  dbUsersCollection: process.env.DB_USERS_COLLECTION as string,
  dbRefreshTokensCollection: process.env.DB_REFRESH_TOKENS_COLLECTION as string,
  dbInvitationsCollection: process.env.DB_INVITATIONS_COLLECTION as string,

  // Security
  passwordSecret: process.env.PASSWORD_SECRET as string,

  // JWT
  jwtSecretAccessToken: process.env.JWT_SECRET_ACCESS_TOKEN as string,
  jwtSecretRefreshToken: process.env.JWT_SECRET_REFRESH_TOKEN as string,
  jwtSecretEmailVerifyToken: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN as string,
  jwtSecretForgotPasswordToken: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN as string,
  jwtSecretInviteToken: process.env.JWT_SECRET_INVITE_TOKEN as string,

  // Token Expiry
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN as string,
  emailVerifyTokenExpiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN as string,
  forgotPasswordTokenExpiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN as string,
  inviteTokenExpiresIn: process.env.INVITE_TOKEN_EXPIRES_IN as string,

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID as string,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI as string,
  clientRedirectCallback: process.env.CLIENT_REDIRECT_CALLBACK as string,

  // Client
  clientUrl: process.env.CLIENT_URL as string,

  // Email (Resend)
  resendApiKey: process.env.RESEND_API_KEY as string,
  resendEmailFromAddress: process.env.RESEND_EMAIL_FROM_ADDRESS as string,

  // File Upload (UploadThing)
  uploadthingToken: process.env.UPLOADTHING_TOKEN as string,

  // Images (Unsplash)
  unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY as string,
  unsplashSecretKey: process.env.UNSPLASH_SECRET_KEY as string,
  unsplashApplicationId: process.env.UNSPLASH_APPLICATION_ID as string
}
```

### CORS Configuration

✅ **DO**: Configure CORS with proper origins and credentials

```typescript
// config/cors.ts
import { CorsOptions } from 'cors'
import { envConfig } from '~/config/environment'

const allowedOrigins = [envConfig.clientUrl]

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true)

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true // Required for cookies
}
```

### Logger Configuration

✅ **DO**: Use chalk for colored console output

```typescript
// config/logger.ts
import chalk from 'chalk'

const logger = {
  info: (message: string) => console.log(chalk.blue(`[INFO] ${message}`)),
  error: (message: string) => console.error(chalk.red(`[ERROR] ${message}`)),
  warn: (message: string) => console.warn(chalk.yellow(`[WARN] ${message}`)),
  success: (message: string) => console.log(chalk.green(`[SUCCESS] ${message}`))
}

export default logger
```

### Rate Limiting

✅ **DO**: Configure rate limiting

```typescript
// config/rate-limit.ts
import rateLimit from 'express-rate-limit'

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
})
```

### Directory Paths

✅ **DO**: Define directory constants

```typescript
// config/dir.ts
import path from 'path'

export const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
export const UPLOAD_IMAGE_TEMP_DIR = path.join(UPLOAD_DIR, 'images', 'temp')
export const UPLOAD_IMAGE_DIR = path.join(UPLOAD_DIR, 'images')
```

## Touch Points / Key Files

- **Environment**: `src/config/environment.ts` - Environment variable validation and defaults
- **CORS**: `src/config/cors.ts` - CORS policy configuration
- **Logger**: `src/config/logger.ts` - Chalk-based logging
- **Directories**: `src/config/dir.ts` - Directory path constants
- **Rate Limit**: `src/config/rate-limit.ts` - Rate limiting configuration

## Environment Files

The application uses environment-specific `.env` files:

- `.env.development` - Development environment
- `.env.staging` - Staging environment
- `.env.production` - Production environment

Required environment variables:

```env
# Server
NODE_ENV=development
PORT=8000
HOST=http://localhost

# Database
DB_URI=mongodb+srv://...
DB_NAME=trellone_dev
DB_USERS_COLLECTION=users
DB_BOARDS_COLLECTION=boards
DB_COLUMNS_COLLECTION=columns
DB_CARDS_COLLECTION=cards
DB_WORKSPACES_COLLECTION=workspaces
DB_REFRESH_TOKENS_COLLECTION=refresh_tokens
DB_INVITATIONS_COLLECTION=invitations

# Security
PASSWORD_SECRET=your_password_secret

# JWT
JWT_SECRET_ACCESS_TOKEN=your_access_token_secret
JWT_SECRET_REFRESH_TOKEN=your_refresh_token_secret
JWT_SECRET_EMAIL_VERIFY_TOKEN=your_email_verify_secret
JWT_SECRET_FORGOT_PASSWORD_TOKEN=your_forgot_password_secret
JWT_SECRET_INVITE_TOKEN=your_invite_token_secret

# Token Expiry
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
EMAIL_VERIFY_TOKEN_EXPIRES_IN=7d
FORGOT_PASSWORD_TOKEN_EXPIRES_IN=15m
INVITE_TOKEN_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/oauth/google
CLIENT_REDIRECT_CALLBACK=http://localhost:3000/login/oauth

# Client
CLIENT_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_EMAIL_FROM_ADDRESS=noreply@yourmail.com

# File Upload (UploadThing)
UPLOADTHING_TOKEN=sk_live_...

# Images (Unsplash)
UNSPLASH_ACCESS_KEY=...
UNSPLASH_SECRET_KEY=...
UNSPLASH_APPLICATION_ID=...
```

## JIT Index Hints

```bash
# Find environment variable usage
rg -n "process\.env\." src/config

# Find config exports
rg -n "export.*Config|export default" src/config

# Find CORS configuration
rg -n "corsOptions|CorsOptions" src/config

# Find envConfig usage throughout app
rg -n "envConfig\." src
```

## Common Gotchas

- **Environment files** - Use `.env.{NODE_ENV}` pattern (`.env.development`, `.env.production`)
- **Type assertions** - Cast env vars to string with `as string`
- **Default values** - Provide sensible defaults for optional variables
- **CORS credentials** - Set `credentials: true` for cookie-based auth
- **Path resolution** - Use `path.join()` for cross-platform compatibility
- **Required variables** - App exits if required env vars are missing

## Pre-PR Checks

```bash
# Type check config
npm run build

# Verify environment variables are validated
rg -n "process\.env\." src/config/environment.ts
```
