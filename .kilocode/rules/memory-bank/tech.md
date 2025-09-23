# TrellOne API — Tech

## Runtime and framework

- Node.js with TypeScript 5.8.x
- Express 4.21.x HTTP server
- Socket.IO 4.8.x for realtime
- MongoDB driver 6.14.x

Sources

- [package.json](package.json)
- [src/index.ts](src/index.ts)
- [src/app.ts](src/app.ts)

## Dependencies and versions

- express ^4.21.2
- socket.io ^4.8.1
- mongodb ^6.14.2
- express-validator ^7.2.1
- jsonwebtoken ^9.0.2
- compression ^1.8.0
- cors ^2.8.5
- cookie-parser ^1.4.7
- dotenv ^16.4.7
- axios ^1.8.4
- lodash ^4.17.21
- mime ^4.0.6
- ms ^2.1.3
- formidable ^3.5.2
- sharp ^0.33.5
- resend ^4.2.0
- uploadthing ^7.6.0
- unsplash-js ^7.0.19

Dev dependencies

- typescript ^5.8.2
- tsx ^4.19.3
- tsc-alias ^1.8.11
- nodemon ^3.1.9
- rimraf ^6.0.1
- eslint ^9.22.0
- prettier ^3.5.3
- typescript-eslint ^8.26.1
- @types/node ^22.13.10 and other @types

Source

- [package.json](package.json)

## NPM scripts

- dev: cross env development with nodemon
- dev:prod, dev:stag: run nodemon with respective NODE_ENV
- build: rimraf dist, tsc compile, tsc-alias for path maps
- start:dev, start:prod, start:stag: run compiled JS
- lint, lint:fix: ESLint across repo
- prettier, prettier:fix

Source

- [package.json](package.json)
- [nodemon.json](nodemon.json)

## TypeScript configuration

- Module NodeNext, target ES2023
- BaseUrl .
- Paths alias "~/_" to "src/_"
- OutDir dist
- files includes [src/type.d.ts](src/type.d.ts)

Source

- [tsconfig.json](tsconfig.json)

## Linting and formatting

- ESLint Flat config with @eslint/js, typescript-eslint
- Prettier plugin enforced via prettier/prettier rule
- Ignores node_modules and dist
- Code style: single quotes, no semicolons, width 120, arrowParens always

Source

- [eslint.config.mjs](eslint.config.mjs)
- [.prettierrc](.prettierrc)

## Environment variables

Required keys are documented in example env:

- Server: PORT, HOST
- MongoDB: DB_NAME, DB_USERNAME, DB_PASSWORD, collection names
- Security: PASSWORD_SECRET
- JWT secrets and expirations for Access, Refresh, EmailVerify, ForgotPassword, Invite
- Client URLs: CLIENT_URL, CLIENT_REDIRECT_CALLBACK
- Google OAuth: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
- Resend: RESEND_API_KEY, RESEND_EMAIL_FROM_ADDRESS
- UploadThing: UPLOADTHING_TOKEN
- Unsplash: UNSPLASH_ACCESS_KEY, UNSPLASH_SECRET_KEY, UNSPLASH_APPLICATION_ID

Source

- [.env.example](.env.example)
- [src/config/environment.ts](src/config/environment.ts)

## CORS and domains

- Whitelist domains derive from env clientUrl and google redirect uri
- Centralized CORS policy in config

Sources

- [src/config/cors.ts](src/config/cors.ts)
- [src/constants/domains.ts](src/constants/domains.ts)

## HTTP and validation

- Centralized HTTP status constants and messages
- express-validator for schema based validation

Sources

- [src/constants/httpStatus.ts](src/constants/httpStatus.ts)
- [src/constants/messages.ts](src/constants/messages.ts)
- [src/middlewares/common.middlewares.ts](src/middlewares/common.middlewares.ts)

## Auth and security

- JWT with multiple token types and expirations
- Access and refresh token flows
- Verified user middleware for gated routes

Sources

- [src/middlewares/auth.middlewares.ts](src/middlewares/auth.middlewares.ts)
- [src/utils/jwt.ts](src/utils/jwt.ts)
- [src/constants/enums.ts](src/constants/enums.ts)

## RBAC

- Role enums for workspace and board
- Permission constants mapped by role

Sources

- [src/constants/enums.ts](src/constants/enums.ts)
- [src/constants/permissions.ts](src/constants/permissions.ts)
- [src/middlewares/rbac.middlewares.ts](src/middlewares/rbac.middlewares.ts)

## Realtime

- Socket.IO server with room scoped broadcasting for boards/workspaces
- Socket handlers per feature in sockets directory

Sources

- [src/utils/socket.ts](src/utils/socket.ts)
- [src/sockets/boards.sockets.ts](src/sockets/boards.sockets.ts)
- [src/sockets/workspaces.sockets.ts](src/sockets/workspaces.sockets.ts)
- [src/sockets/cards.sockets.ts](src/sockets/cards.sockets.ts)
- [src/sockets/invitations.sockets.ts](src/sockets/invitations.sockets.ts)

## File processing and media

- Formidable for multipart parsing, Sharp for image processing
- UploadThing provider integration
- Unsplash for cover photos

Sources

- [src/utils/file.ts](src/utils/file.ts)
- [src/providers/uploadthing.ts](src/providers/uploadthing.ts)
- [src/providers/unsplash.ts](src/providers/unsplash.ts)
- [src/controllers/medias.controllers.ts](src/controllers/medias.controllers.ts)

## Email provider

- Resend for verification, reset password, invitations via HTML templates

Sources

- [src/providers/resend.ts](src/providers/resend.ts)
- [src/templates/verify-email.html](src/templates/verify-email.html)
- [src/templates/forgot-password.html](src/templates/forgot-password.html)
- [src/templates/board-invitation.html](src/templates/board-invitation.html)
- [src/templates/workspace-invitation.html](src/templates/workspace-invitation.html)

## Database

- Centralized connection and typed collection access via database service

Sources

- [src/services/database.services.ts](src/services/database.services.ts)
- [src/models/schemas/User.schema.ts](src/models/schemas/User.schema.ts)
- [src/models/schemas/Board.schema.ts](src/models/schemas/Board.schema.ts)
- [src/models/schemas/Column.schema.ts](src/models/schemas/Column.schema.ts)
- [src/models/schemas/Card.schema.ts](src/models/schemas/Card.schema.ts)
- [src/models/schemas/Workspace.schema.ts](src/models/schemas/Workspace.schema.ts)
- [src/models/schemas/Invitation.schema.ts](src/models/schemas/Invitation.schema.ts)
- [src/models/schemas/RefreshToken.schema.ts](src/models/schemas/RefreshToken.schema.ts)

## Build and deploy

- Multi-stage Docker build produces minimal runtime image
- Run with PM2 in container using ecosystem config
- Render deployment reference docs provided

Sources

- [Dockerfile](Dockerfile)
- [ecosystem.config.js](ecosystem.config.js)
- [src/docs/DEPLOY_RENDER.md](src/docs/DEPLOY_RENDER.md)

## Local development workflow

- Install: npm ci
- Configure environment: copy [.env.example](.env.example) to .env and fill values
- Run dev server: npm run dev
- Build: npm run build
- Start compiled: npm run start:dev
- Lint: npm run lint and npm run lint:fix
- Format: npm run prettier and npm run prettier:fix

## Observability and logging

- Centralized logger utility

Sources

- [src/config/logger.ts](src/config/logger.ts)
