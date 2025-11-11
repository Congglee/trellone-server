# Config - Agent Guide

## Package Identity

Configuration layer for Trellone API. Environment variable validation, CORS setup, logging configuration, and directory paths.

## Setup & Run

Config modules are imported and used throughout the application. No separate build step needed.

```typescript
import { envConfig } from '~/config/environment'
import corsConfig from '~/config/cors'
```

## Patterns & Conventions

### File Organization

- **Environment**: `src/config/environment.ts` - Environment variable validation
- **CORS**: `src/config/cors.ts` - CORS policy configuration
- **Logger**: `src/config/logger.ts` - Logging setup
- **Directories**: `src/config/dir.ts` - Directory path constants
- **Rate Limit**: `src/config/rate-limit.ts` - Rate limiting configuration

✅ **DO**: Follow `src/config/environment.ts` pattern
- Validate environment variables
- Provide sensible defaults
- Export validated config object

### Environment Configuration

✅ **DO**: Validate environment variables
```typescript
// config/environment.ts
import { config } from 'dotenv'
config()

export const envConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 4000,
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || '',
  // ... other env vars
}
```

✅ **DO**: Provide sensible defaults
```typescript
PORT: Number(process.env.PORT) || 4000
```

✅ **DO**: Validate required variables
```typescript
if (!envConfig.MONGODB_URI) {
  throw new Error('MONGODB_URI is required')
}
```

### CORS Configuration

✅ **DO**: Configure CORS with proper origins
```typescript
// config/cors.ts
import { CorsOptions } from 'cors'

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}

export default corsOptions
```

### Logger Configuration

✅ **DO**: Use consistent logging format
```typescript
// config/logger.ts
import winston from 'winston'

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console()
  ]
})
```

### Directory Paths

✅ **DO**: Define directory constants
```typescript
// config/dir.ts
import path from 'path'

export const UPLOAD_DIR = path.join(process.cwd(), 'uploads')
export const TEMPLATE_DIR = path.join(process.cwd(), 'src', 'templates')
```

## Touch Points / Key Files

- **Environment**: `src/config/environment.ts` - Environment variable validation and defaults
- **CORS**: `src/config/cors.ts` - CORS policy configuration
- **Logger**: `src/config/logger.ts` - Logging setup (if using winston)
- **Directories**: `src/config/dir.ts` - Directory path constants
- **Rate Limit**: `src/config/rate-limit.ts` - Rate limiting configuration

## JIT Index Hints

```bash
# Find environment variable usage
rg -n "process\.env\." src/config

# Find config exports
rg -n "export.*Config|export default" src/config

# Find CORS configuration
rg -n "corsOptions|CorsOptions" src/config
```

## Common Gotchas

- **Environment validation** - Always validate required environment variables
- **Default values** - Provide sensible defaults for optional variables
- **Type conversion** - Convert string env vars to numbers/booleans
- **CORS credentials** - Set `credentials: true` for cookie-based auth
- **Path resolution** - Use `path.join()` for cross-platform compatibility

## Pre-PR Checks

```bash
# Type check config
npm run build

# Verify environment variables are validated
rg -n "process\.env\." src/config/environment.ts
```

