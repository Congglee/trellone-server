# TrellOne API — Current Context

## Current focus

- Initialize and standardize the Memory Bank to preserve project knowledge across sessions.
- Document architecture, product overview, and technical stack for quick onboarding and continuity.
- Prepare repeatable task recipes to accelerate future development.

## Recent changes

- Created product overview: [product.md](.kilocode/rules/memory-bank/product.md)
- Created system architecture: [architecture.md](.kilocode/rules/memory-bank/architecture.md)
- Created technical overview: [tech.md](.kilocode/rules/memory-bank/tech.md)
- Validated project configuration and tooling via:
  - [package.json](package.json)
  - [tsconfig.json](tsconfig.json)
  - [eslint.config.mjs](eslint.config.mjs)
  - [nodemon.json](nodemon.json)
  - [.env.example](.env.example)

## Codebase highlights (verified)

- Entry and app lifecycle:
  - [src/index.ts](src/index.ts)
  - [src/app.ts](src/app.ts)
- Layered organization:
  - Routes: [src/routes](src/routes)
  - Middlewares: [src/middlewares](src/middlewares)
  - Controllers: [src/controllers](src/controllers)
  - Services: [src/services](src/services)
  - Models: [src/models](src/models)
  - Sockets: [src/sockets](src/sockets)
  - Providers: [src/providers](src/providers)
  - Utilities: [src/utils](src/utils)
- Environment and security:
  - [src/config/environment.ts](src/config/environment.ts)
  - [src/constants/domains.ts](src/constants/domains.ts)
  - [src/constants/enums.ts](src/constants/enums.ts)

## Next steps

- Create tasks.md with repeatable workflows for:
  - Adding a new feature (route → middlewares → controller → service → sockets optional)
  - Adding a new MongoDB schema and request types
  - Adding RBAC or validation to existing endpoints
  - File upload and media processing flow
  - OAuth configuration and callback handling
  - Deployment (Docker + PM2) and Render reference
- Review and validate Memory Bank for completeness and internal consistency.
- Present drafts for review, then finalize files.

## Open questions and assumptions

- Deployment targets:
  - Assuming Docker + PM2 based runtime with Render as reference per [src/docs/DEPLOY_RENDER.md](src/docs/DEPLOY_RENDER.md).
- Monitoring/observability:
  - Central logger exists ([src/config/logger.ts](src/config/logger.ts)); no specific external APM configured.
- Storage:
  - MongoDB Atlas as primary database; soft delete pattern across domain entities.
- Email and external services:
  - Resend for transactional email, UploadThing for files, Unsplash for images, Google OAuth for SSO.
- CORS and client:
  - Whitelist based on clientUrl and Google redirect from env; ensure correct domains in production.

## Risks and considerations

- Environment variable completeness is critical; validation in [src/config/environment.ts](src/config/environment.ts) should fail early on misconfig.
- JWT expiration values and secrets must be set per environment and rotated per policy.
- File upload constraints (size/type) and image processing require proper resource limits in production.
- Socket.IO room scoping correctness is essential for privacy and performance on boards/workspaces.

## Short-term priorities

1. Document repeatable workflows in [tasks.md](.kilocode/rules/memory-bank/tasks.md) for consistent delivery.
2. Confirm deployment environment details to tailor Docker/PM2 guidance if needed.
3. Align security defaults (cookies, CORS, token lifetimes) with production posture.

## Status summary

- Memory Bank: initializing, core files created.
- Pending: tasks.md, validation pass, review, finalize.
