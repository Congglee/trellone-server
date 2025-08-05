# API Routes Layers Pattern

## Brief overview

This rule documents the established patterns, conventions, and best practices for defining, organizing, and consuming API routes in the TrellOne Express.js application. These guidelines ensure consistency, maintainability, and proper separation of concerns across all route definitions.

## File organization and naming

- Route files follow the pattern `{feature}.routes.ts` using kebab-case
- Each route file exports a default router instance
- Router variables use camelCase: `{feature}Router` (e.g., `authRouter`, `boardsRouter`)
- Route files are organized by domain/feature in the `src/routes/` directory
- Import order: Express Router → Controllers → Middlewares → Types → Utils

## Route definition patterns

- Use Express Router instances for modular route organization
- Apply middleware chains in consistent order: Authentication → Validation → Filtering → Controller
- Wrap all controllers with `wrapRequestHandler` for centralized error handling
- Use TypeScript imports with path aliases (`~/controllers/`, `~/middlewares/`)
- Group related routes within the same router file

## Middleware chaining conventions

- **Authentication first**: `accessTokenValidator` for protected routes
- **User verification**: `verifiedUserValidator` for verified user requirements
- **Resource validation**: Feature-specific ID validators (e.g., `boardIdValidator`, `cardIdValidator`)
- **Input validation**: Feature-specific validators for request body/query validation
- **Body filtering**: `filterMiddleware<Type>([...fields])` to whitelist allowed fields
- **Controller execution**: Always wrap with `wrapRequestHandler(controller)`

## Authentication patterns

- Use `accessTokenValidator` for all protected routes
- Apply `verifiedUserValidator` for routes requiring email verification
- Public routes (like login, register) don't require authentication middleware
- OAuth routes follow the pattern `/oauth/{provider}`

## Request validation approach

- Create feature-specific middleware files (e.g., `boards.middlewares.ts`)
- Use descriptive validator names: `{action}{Feature}Validator` (e.g., `createBoardValidator`)
- Apply resource ID validators for parameterized routes
- Validate query parameters with dedicated validators (e.g., `paginationValidator`)

## Body filtering implementation

- Use `filterMiddleware<RequestType>([...allowedFields])` to whitelist request body fields
- Import request types from `~/models/requests/` for type safety
- Apply filtering after validation but before controller execution
- Define allowed fields arrays in request type files when reused

## Controller integration

- Import controllers from corresponding controller files
- Use descriptive controller names: `{action}{Feature}Controller`
- Always wrap controllers with `wrapRequestHandler` for error handling
- Controllers should be the last item in the middleware chain

## Route mounting strategy

- Mount routes in `app.ts` with clear, hierarchical prefixes
- Follow domain hierarchy: `/workspaces` → `/boards` → `/columns` → `/cards`
- Use semantic prefixes that reflect the resource structure
- Mount authentication routes at `/auth` prefix
- Mount utility routes (media, invitations) with descriptive prefixes

## HTTP method conventions

- **POST**: Create new resources (e.g., `POST /boards`)
- **GET**: Retrieve resources (e.g., `GET /boards/:board_id`)
- **PUT**: Update entire resources (e.g., `PUT /boards/:board_id`)
- **PATCH**: Partial updates (e.g., `PATCH /users/me`)
- **DELETE**: Remove resources (e.g., `DELETE /cards/:card_id`)

## Special route patterns

- Support routes use descriptive paths: `/supports/moving-card`
- Nested resource operations: `/:parent_id/child/:child_id/action`
- Verification routes: `/verify-{action}` for token-based operations
- Utility routes: `/upload-{type}` for file operations

## Error handling integration

- All routes must use `wrapRequestHandler` for consistent error handling
- Error handling middleware (`defaultErrorHandler`) mounted last in app.ts
- Validation errors handled automatically by express-validator middleware
- Custom errors thrown in controllers are caught by the wrapper

## TypeScript integration

- Import request/response types from `~/models/requests/`
- Use generic types with `filterMiddleware<RequestType>`
- Maintain type safety throughout the middleware chain
- Export router with proper TypeScript typing
