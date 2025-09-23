# TrellOne API — Product Overview

## Mission

Provide a secure, real‑time, and maintainable backend API for a Trello‑style collaboration app, enabling teams to organize work into workspaces, boards, columns, and cards with consistent validation, role‑based access, and reliable persistence.

## Why this project exists

- Teams need a flexible system to organize work visually while maintaining strong access control and auditability.
- Real‑time collaboration requires a backend designed for concurrent updates and event broadcasting.
- Developer velocity improves when APIs follow predictable patterns and a clear layered architecture.

## Problems it solves

- Fragmented task management across teams and projects.
- Inconsistent access control and sharing across resources (workspaces, boards).
- Lack of real‑time synchronization for card and board updates.
- Ad‑hoc validation leading to instability and security issues.
- Unscalable file handling and media storage patterns.

## How it should work (high level)

- RESTful API exposing resources for users, workspaces, boards, columns, cards, invitations, and media.
- Authentication via JWT with email verification and password reset flows.
- Role‑based access control at the workspace and board levels.
- Real‑time updates via Socket.IO rooms scoped to boards/workspaces.
- Robust validation and error handling using middleware chains.
- Efficient MongoDB data access with clear collection boundaries and soft deletes.

## Target users

- Teams and organizations needing visual project/task boards.
- Individual users looking for a lightweight but powerful Kanban system.
- Integrators who need a clean, well‑documented API to build custom frontends or automations.

## Core features

- Authentication and user lifecycle
  - Register, login, logout, refresh.
  - Email verification, password reset via Resend email provider.
  - Google OAuth support via configured credentials.
- Workspaces and boards
  - Create, update, delete (soft‑delete) workspaces and boards.
  - Public/private visibility and role assignments.
  - Invitations for guests and members with token verification.
- Columns and cards
  - CRUD operations with ordering semantics.
  - Moving cards within and across columns with validations.
  - Comments, attachments, members, and reactions support patterns.
- Media and file handling
  - Secure upload handling with Formidable and Sharp image processing.
  - Integration with UploadThing for external storage/CDN.
  - Unsplash integration for cover photos and assets.
- Real‑time collaboration
  - Socket.IO rooms for board/workspace events.
  - Event‑driven updates for card moves, member changes, etc.
- Security and validation
  - Token verification middlewares and verified‑user checks.
  - Express‑validator schemas with centralized error handling.
  - CORS with whitelist and environment‑aware policies.

## Non‑goals (current scope)

- Rich notifications/feeds beyond real‑time board events.
- Full audit logging across all actions.
- Advanced analytics or reporting dashboards.
- Built‑in payments/billing.

## Success metrics

- Stable API surface and backward‑compatible changes.
- Low error rate under concurrent usage (real‑time moves).
- Predictable latencies for core flows (auth, CRUD).
- Security posture: input validation coverage and limited attack surface.

## Key user flows

- Registration & verification
  1. User registers with email/password.
  2. System sends verification email (Resend).
  3. User verifies and gains access to protected routes.
- Login & session
  1. User logs in, receives access/refresh tokens.
  2. Refresh token rotation and logout support.
- Workspace creation & sharing
  1. Create workspace → invite members/guests.
  2. Assign roles → manage workspace resources.
- Board lifecycle
  1. Create board within workspace (public/private).
  2. Add columns and cards; reorder and move cards.
  3. Invite members; manage roles and permissions.
- Real‑time collaboration
  1. Users subscribe to board rooms via Socket.IO.
  2. Card moves, comments, and member changes broadcast to room.
- Media operations
  1. Upload and process images/documents (Sharp, Formidable).
  2. Retrieve and serve via UploadThing/CDN when configured.

## Experience goals

- Fast, minimal friction for common operations (create board, add card, move card).
- Clear and consistent error messages.
- Smooth collaboration with minimal conflicts (event‑driven, room‑based updates).
- Predictable behaviors through layered architecture and conventions.

## Constraints & assumptions

- MongoDB Atlas used as primary database (collections for each domain).
- JWT secrets and environment variables must be set per environment.
- CORS whitelist must include client app and OAuth redirect URIs.
- Soft delete preferred over hard delete; clients honor \_destroy flags.
- Production deployments may run via Docker + PM2 or PaaS (Render).

## External integrations (current)

- Resend for transactional email (verify, reset password, invitations).
- UploadThing for file uploads and CDN distribution.
- Unsplash for image search and cover photos.
- Google OAuth for social sign‑in.

## Future directions (candidate)

- Enhanced audit trails and activity feeds.
- Webhooks for outbound event integrations.
- Granular permissions per action on cards/comments.
- Search and indexing for cards and attachments.
- Extensible automation hooks (rules, triggers, actions).
