# Providers - Agent Guide

## Package Identity

External service integrations for Trellone API. Email service (Resend), image service (Unsplash), and file upload service (UploadThing).

## Setup & Run

Providers are imported and used in services. No separate build step needed.

```typescript
import { sendVerifyRegisterEmail, sendForgotPasswordEmail } from '~/providers/resend'
import { getSearchPhotosFromUnsplash } from '~/providers/unsplash'
import { uploadFileToUploadthing, utapi } from '~/providers/uploadthing'
```

## Patterns & Conventions

### File Organization

- **One file per provider**: Each external service has its own provider file
- **Naming**: Use kebab-case matching service name (e.g., `resend.ts`, `unsplash.ts`)
- **Exports**: Named exports for individual functions

✅ **DO**: Follow `src/providers/resend.ts` pattern

- Configure service client with API keys from envConfig
- Export specific functions for each use case
- Handle templates and configuration internally

### Resend (Email Service)

✅ **DO**: Configure Resend and export specific email functions

```typescript
// providers/resend.ts
import { Resend } from 'resend'
import { envConfig } from '~/config/environment'
import path from 'path'
import fs from 'fs'

// Load email templates
const verifyEmailTemplate = fs.readFileSync(path.resolve('src/templates/verify-email.html'), 'utf-8')
const forgotPasswordTemplate = fs.readFileSync(path.resolve('src/templates/forgot-password.html'), 'utf-8')
const workspaceInvitationTemplate = fs.readFileSync(path.resolve('src/templates/workspace-invitation.html'), 'utf-8')
const boardInvitationTemplate = fs.readFileSync(path.resolve('src/templates/board-invitation.html'), 'utf-8')

const resend = new Resend(envConfig.resendApiKey)

// Internal helper
const sendVerifyEmail = (toAddress: string, subject: string, body: string, fromAddress?: string) => {
  return resend.emails.send({
    from: fromAddress || envConfig.resendEmailFromAddress,
    to: toAddress,
    subject,
    html: body
  })
}

// Exported functions
export const sendVerifyRegisterEmail = (toAddress: string, email_verify_token: string) => {
  return sendVerifyEmail(
    toAddress,
    'Confirm your email address',
    verifyEmailTemplate
      .replace('{{title}}', 'Account registration confirmation')
      .replace('{{content}}', `Hi ${toAddress},`)
      .replace('{{title_link}}', 'Confirm your email')
      .replace('{{link}}', `${envConfig.clientUrl}/account/verification?token=${email_verify_token}&email=${toAddress}`)
  )
}

export const sendForgotPasswordEmail = (toAddress: string, forgot_password_token: string) => {
  // Similar pattern
}

export const sendBoardInvitationEmail = ({
  toAddress,
  invite_token,
  boardTitle,
  boardId,
  inviterName
}: {
  toAddress: string
  invite_token: string
  boardTitle: string
  boardId: string
  inviterName: string
}) => {
  // Uses custom from address with inviter name
}

export const sendWorkspaceInvitationEmail = ({...}: {...}) => {
  // Similar pattern
}
```

### Unsplash (Image Service)

✅ **DO**: Configure Unsplash and export search functions

```typescript
// providers/unsplash.ts
import { createApi } from 'unsplash-js'
import { envConfig } from '~/config/environment'

const unsplash = createApi({
  accessKey: envConfig.unsplashAccessKey
})

export const getSearchPhotosFromUnsplash = async (query: string, page: number = 1, perPage: number = 29) => {
  const getSearchPhotosRes = await unsplash.search.getPhotos({
    query,
    page,
    perPage,
    orientation: 'landscape'
  })

  return getSearchPhotosRes
}
```

### UploadThing (File Upload Service)

✅ **DO**: Configure UTApi and export upload functions

```typescript
// providers/uploadthing.ts
import { UTApi } from 'uploadthing/server'
import fs from 'fs'
import { envConfig } from '~/config/environment'

export const utapi = new UTApi({ token: envConfig.uploadthingToken })

export const uploadFileToUploadthing = async (filePath: string, fileName: string, mimeType: string) => {
  // Read the file as Buffer
  const buffer = fs.readFileSync(filePath)

  // Create a File from the buffer
  const file = new File([buffer], fileName, { type: mimeType })

  // Upload file
  const uploadRes = await utapi.uploadFiles([file])

  return uploadRes[0].data // Return the first (and only) result
}
```

### Service Integration

✅ **DO**: Use providers in services, not controllers

```typescript
// ✅ Good - use in service
// services/auth.services.ts
import { sendVerifyRegisterEmail, sendForgotPasswordEmail } from '~/providers/resend'

class AuthService {
  async register(body: RegisterReqBody) {
    // ... create user
    await sendVerifyRegisterEmail(body.email, email_verify_token)
    // ...
  }

  async forgotPassword({ email, user_id, verify }: {...}) {
    // ... generate token
    await sendForgotPasswordEmail(email, forgot_password_token)
    // ...
  }
}
```

```typescript
// ✅ Good - use in service
// services/medias.services.ts
import { getSearchPhotosFromUnsplash } from '~/providers/unsplash'
import { uploadFileToUploadthing } from '~/providers/uploadthing'

class MediasService {
  async searchPhotos(query: string, page?: number, perPage?: number) {
    return await getSearchPhotosFromUnsplash(query, page, perPage)
  }

  async uploadFile(filePath: string, fileName: string, mimeType: string) {
    return await uploadFileToUploadthing(filePath, fileName, mimeType)
  }
}
```

❌ **DON'T**: Use providers directly in controllers

### Email Templates

Email templates are stored in `src/templates/`:

- `verify-email.html` - Email verification template
- `forgot-password.html` - Password reset template
- `board-invitation.html` - Board invitation template
- `workspace-invitation.html` - Workspace invitation template

Templates use `{{placeholder}}` syntax for dynamic content.

## Touch Points / Key Files

- **Resend**: `src/providers/resend.ts` - Email service integration
  - `sendVerifyRegisterEmail` - Registration verification
  - `sendForgotPasswordEmail` - Password reset
  - `sendBoardInvitationEmail` - Board invitations
  - `sendWorkspaceInvitationEmail` - Workspace invitations
- **Unsplash**: `src/providers/unsplash.ts` - Image search for cover photos
  - `getSearchPhotosFromUnsplash` - Search landscape photos
- **UploadThing**: `src/providers/uploadthing.ts` - File upload service
  - `utapi` - UTApi instance for direct access
  - `uploadFileToUploadthing` - Upload file from path
- **Templates**: `src/templates/` - Email HTML templates

## JIT Index Hints

```bash
# Find provider usage
rg -n "from '~/providers" src

# Find email sending functions
rg -n "sendVerifyRegisterEmail|sendForgotPasswordEmail|sendBoardInvitationEmail" src

# Find Unsplash usage
rg -n "getSearchPhotosFromUnsplash" src

# Find UploadThing usage
rg -n "uploadFileToUploadthing|utapi" src

# Find API key usage
rg -n "envConfig\." src/providers
```

## Common Gotchas

- **Environment variables** - Always use `envConfig` for API keys
- **Service layer** - Use providers in services, not controllers
- **Named exports** - Export specific functions, not client instances (except `utapi`)
- **Template loading** - Templates loaded at startup with `fs.readFileSync`
- **Error handling** - Provider errors bubble up to service layer

## Pre-PR Checks

```bash
# Type check providers
npm run build

# Verify API keys come from envConfig
rg -n "envConfig\." src/providers

# Verify providers used in services
rg -n "from '~/providers" src/services
```
