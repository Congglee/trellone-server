# TrellOne API — Repeatable Workflows

This file captures step-by-step recipes for common, repetitive tasks in this codebase. Follow these to keep consistency across layers (routes → middlewares → controllers → services → database) and real-time flows (sockets).

## 1) Add a new feature endpoint (Route → Middlewares → Controller → Service → Sockets optional)

Objective: Introduce a new API capability within an existing domain or a new domain while following layering, validation, and error-handling conventions.

References:

- Routes pattern: [api-routes.md](.kilocode/rules/api-routes.md)
- Middleware pattern: [middleware-patterns.md](.kilocode/rules/middleware-patterns.md)
- Controller pattern: [controller-patterns.md](.kilocode/rules/controller-patterns.md)
- Service pattern: [service-patterns.md](.kilocode/rules/service-patterns.md)

Files to consider:

- Route: [src/routes](src/routes)
- Middlewares (feature-specific): [src/middlewares](src/middlewares)
- Controller: [src/controllers](src/controllers)
- Service: [src/services](src/services)
- Sockets (optional, if real-time notif): [src/sockets](src/sockets)
- Types and constants: [src/models/requests](src/models/requests), [src/constants/enums.ts](src/constants/enums.ts), [src/constants/messages.ts](src/constants/messages.ts)

Steps:

1. Define request/response types
   - Create or update requests file in [src/models/requests](src/models/requests).
   - Export body, params, query interfaces and reusable allowlists for filter middleware.
2. Add validation middleware(s)
   - In [src/middlewares](src/middlewares), create {feature}.middlewares.ts if new.
   - Use checkSchema-based validators; wrap with validate() from [src/utils/validation.ts](src/utils/validation.ts).
   - Implement resource ID validators if route is parameterized; attach found resources onto req object.
3. Implement controller
   - Create `{action}{Feature}Controller` in [src/controllers](src/controllers).
   - Extract user_id from token in req.decoded_authorization as needed; format response as `{ message, result? }`.
   - Delegate business logic entirely to the service.
4. Implement service method
   - Add method on {feature}.services.ts in [src/services](src/services) with clear input interfaces.
   - Access DB through [src/services/database.services.ts](src/services/database.services.ts) only; throw ErrorWithStatus for domain errors.
5. Wire the route
   - Create or update {feature}.routes.ts in [src/routes](src/routes) and compose: Authentication → Resource validation → Input validation → filterMiddleware → wrapRequestHandler(controller).
   - Mount route is already managed in [src/app.ts](src/app.ts).
6. Real-time (optional)
   - If update needs to broadcast, add a socket handler under [src/sockets](src/sockets) and emit to board/workspace rooms via [src/utils/socket.ts](src/utils/socket.ts).
7. Messages and enums
   - Add or reuse messages in [src/constants/messages.ts](src/constants/messages.ts) and any enum values in [src/constants/enums.ts](src/constants/enums.ts).
8. Test via local dev
   - Start with `npm run dev`. Verify validators, auth, and error middleware.

Checklist:

- Route uses wrapRequestHandler
- Validators and filterMiddleware applied
- Controller has thin logic and consistent response shape
- Service encapsulates business rules and DB
- Optional socket emission added
- Messages/enums updated

## 2) Add a new MongoDB schema and request types

Objective: Introduce a new collection with typed schema class and request type interfaces.

References:

- Schema patterns: [mongodb-schema-patterns.md](.kilocode/rules/mongodb-schema-patterns.md)
- Requests folder: [src/models/requests](src/models/requests)
- Schemas folder: [src/models/schemas](src/models/schemas)

Files to create/update:

- Schema: [src/models/schemas](src/models/schemas)
- Requests: [src/models/requests](src/models/requests)
- Database service collection getter: [src/services/database.services.ts](src/services/database.services.ts)

Steps:

1. Create TypeScript interface {Entity}Schema and Class {Entity} in [src/models/schemas](src/models/schemas)
   - Follow Interface + Class pattern with defaults and `_destroy` soft-delete flag.
   - Use ObjectId for IDs; do not store string IDs.
2. Add collection getter in database service
   - Update [src/services/database.services.ts](src/services/database.services.ts) to expose the new collection with correct typing.
3. Define request types
   - Create `{Entity}.requests.ts` in [src/models/requests](src/models/requests) with Body/Params/Query and allowlists for filterMiddleware.
4. Wire validators
   - Add checkSchema validators to new or existing middlewares file.
5. Integrate service and route
   - Add new service methods and route endpoints as needed.

Checklist:

- Interface + Class implemented with defaults and timestamps
- DB service exposes typed collection
- Request types created and imported by validators
- Validators enforce inputs before controller/service

## 3) Add RBAC or validation to existing endpoints

Objective: Strengthen access control and input quality for an existing route.

References:

- RBAC middleware: [src/middlewares/rbac.middlewares.ts](src/middlewares/rbac.middlewares.ts)
- Enums and permissions: [src/constants/enums.ts](src/constants/enums.ts), [src/constants/permissions.ts](src/constants/permissions.ts)
- Validation utilities: [src/utils/validation.ts](src/utils/validation.ts)

Steps:

1. Identify route and controller in [src/routes](src/routes) and [src/controllers](src/controllers).
2. Add or adjust middleware chain
   - Ensure `accessTokenValidator`, `verifiedUserValidator` if required.
   - Insert RBAC middleware based on role/permission requirements.
3. Input validation
   - Add or refine checkSchema validators and apply filterMiddleware with allowlists.
4. Service guardrails
   - Enforce permission cross-checks and ownership rules inside the service method as needed.

Checklist:

- Authentication and verification applied
- Role-based check installed where necessary
- Input validation complete with detailed errors
- Service re-checks critical authorization

## 4) File upload and media processing flow

Objective: Add or modify endpoints supporting uploads with Sharp processing and UploadThing integration.

References:

- File utils: [src/utils/file.ts](src/utils/file.ts)
- Medias controller/service: [src/controllers/medias.controllers.ts](src/controllers/medias.controllers.ts), [src/services/medias.services.ts](src/services/medias.services.ts)
- Provider: [src/providers/uploadthing.ts](src/providers/uploadthing.ts)

Steps:

1. Controller accepts multipart request
   - Pass full `req` to service if necessary for streaming.
2. Service parses files and validates type/size via [src/utils/file.ts](src/utils/file.ts)
   - Process images with Sharp if needed.
3. Upload to external provider
   - Use UploadThing integration from [src/providers/uploadthing.ts](src/providers/uploadthing.ts).
4. Return media metadata
   - Ensure consistent response format and clean up temp files if any.

Checklist:

- MIME and size validation enforced
- Sharp transformations applied as required
- Provider errors handled with ErrorWithStatus
- Response includes URLs/metadata needed by client

## 5) OAuth (Google) configuration and callback handling

Objective: Set up Google sign-in flow end-to-end.

References:

- Docs: [src/docs/GOOGLE_OAUTH.md](src/docs/GOOGLE_OAUTH.md)
- Env: [.env.example](.env.example)
- Auth routes/middlewares: [src/routes/auth.routes.ts](src/routes/auth.routes.ts), [src/middlewares/auth.middlewares.ts](src/middlewares/auth.middlewares.ts)

Steps:

1. Configure env
   - Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, CLIENT_REDIRECT_CALLBACK in environment.
2. Add or verify routes under `/auth/oauth/google` (initiate) and `/auth/oauth/google/callback`.
3. Controller and service
   - Exchange code for tokens, fetch profile, create or map user, issue JWTs and cookies.
4. Redirect back to client
   - Append status and tokens or session info as per design.

Checklist:

- Redirect URIs match exactly in Google Console and env
- Secure cookie settings for production
- Verified-user logic aligns with product expectations

## 6) Deployment (Docker + PM2) with Render reference

Objective: Build and run production image consistently.

References:

- Dockerfile at repo root: [Dockerfile](Dockerfile)
- PM2 ecosystem config: [ecosystem.config.js](ecosystem.config.js)
- Render doc: [src/docs/DEPLOY_RENDER.md](src/docs/DEPLOY_RENDER.md)

Steps:

1. Build image
   - `docker build -t trellone-api:latest .`
2. Run container
   - `docker run -p 8000:8000 --env-file .env.production trellone-api:latest`
3. PM2 inside container
   - Confirm ecosystem config points to dist/index.js and sets proper env vars.
4. Render deploy
   - Follow Render doc for image or Node service; ensure env variables populated.

Checklist:

- `.env.production` complete and mounted
- Port mapping and health checks set
- PM2 logs validated after start

## 7) Real-time events pattern (boards/workspaces)

Objective: Emit and subscribe to events with room scoping for privacy and performance.

References:

- Socket utils/server: [src/utils/socket.ts](src/utils/socket.ts)
- Sockets: [src/sockets](src/sockets)

Steps:

1. Determine room key (e.g., board_id or workspace_id).
2. Emit from service/controller after state changes.
3. Client subscribes to corresponding room; ensure auth gating if required.

Checklist:

- Room naming consistent
- Emissions only after successful DB write
- Event payload minimal but sufficient for UI updates

## 8) Invitations flow (workspace/board)

Objective: Create, send, verify invitations and update membership.

References:

- Invitation artifacts: [src/models/schemas/Invitation.schema.ts](src/models/schemas/Invitation.schema.ts), [src/controllers/invitations.controllers.ts](src/controllers/invitations.controllers.ts), [src/services/invitations.services.ts](src/services/invitations.services.ts)
- Email templates: [src/templates](src/templates)
- Provider: [src/providers/resend.ts](src/providers/resend.ts)

Steps:

1. Create invitation
   - Generate token (JWT secret for INVITE), save document with status.
   - Send email via Resend with template data.
2. Verify invitation
   - Validate token, role, and membership constraints.
3. Accept/decline
   - Update membership on target resource and mark invitation consumed.

Checklist:

- Token expirations from env applied
- Template and provider configured with verified sender
- Edge cases: re-invite before expiry, revoked access, soft-deleted resources handled

---

## PR Review Quick Checklist

- Route chain includes auth/validators/filter + wrapRequestHandler
- Controller returns `{ message, result? }` and delegates to service
- Service performs business rules and DB operations through databaseService
- Request types and validators thoroughly cover inputs
- Error messages leverage constants; HTTP codes correct
- Real-time emissions scoped to correct room(s)
- Environment variables documented and validated
