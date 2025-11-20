# Providers - Agent Guide

## Package Identity

External service integrations for Trellone API. Email service (Resend), image service (Unsplash), and file upload service (UploadThing).

## Setup & Run

Providers are imported and used in services. No separate build step needed.

```typescript
import resendProvider from '~/providers/resend'
import unsplashProvider from '~/providers/unsplash'
import uploadthingProvider from '~/providers/uploadthing'
```

## Patterns & Conventions

### File Organization

- **One file per provider**: Each external service has its own provider file
- **Naming**: Use kebab-case matching service name (e.g., `resend.ts`, `unsplash.ts`)
- **Exports**: Default export of configured provider instance

✅ **DO**: Follow `src/providers/resend.ts` pattern

- Configure service client with API keys
- Export configured instance as default
- Handle errors appropriately

### Provider Structure

✅ **DO**: Configure and export provider instance

```typescript
// providers/resend.ts
import { Resend } from 'resend'
import { envConfig } from '~/config/environment'

const resend = new Resend(envConfig.RESEND_API_KEY)

export default resend
```

✅ **DO**: Use environment variables for API keys

```typescript
import { envConfig } from '~/config/environment'

const unsplash = createApi({
  accessKey: envConfig.UNSPLASH_ACCESS_KEY
})
```

### Error Handling

✅ **DO**: Handle provider errors gracefully

```typescript
try {
  const result = await resend.emails.send({
    from: 'noreply@trellone.app',
    to: email,
    subject: 'Welcome',
    html: template
  })
  return result
} catch (error) {
  throw new ErrorWithStatus({
    message: 'Failed to send email',
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR
  })
}
```

### Service Integration

✅ **DO**: Use providers in services, not controllers

```typescript
// ✅ Good - use in service
// services/auth.services.ts
import resendProvider from '~/providers/resend'

async sendVerificationEmail(email: string, token: string) {
  await resendProvider.emails.send({...})
}

// ❌ Bad - don't use directly in controllers
```

## Touch Points / Key Files

- **Resend**: `src/providers/resend.ts` - Email service integration
- **Unsplash**: `src/providers/unsplash.ts` - Image service for cover photos
- **UploadThing**: `src/providers/uploadthing.ts` - File upload service integration

## JIT Index Hints

```bash
# Find provider usage
rg -n "from '~/providers" src

# Find provider configuration
rg -n "new.*\(|createApi" src/providers

# Find API key usage
rg -n "API_KEY|ACCESS_KEY" src/providers
```

## Common Gotchas

- **Environment variables** - Always use env vars for API keys
- **Error handling** - Wrap provider calls in try-catch
- **Service layer** - Use providers in services, not controllers
- **Default export** - Export configured instance as default
- **Configuration** - Keep provider configuration in provider files

## Pre-PR Checks

```bash
# Type check providers
npm run build

# Verify API keys come from env vars
rg -n "process\.env\." src/providers
```
