# TrellOne API - Project Structure

## Brief overview

This rule outlines the directory structure and important files for the TrellOne API project. The project follows a layered architecture pattern with clear separation of concerns across different directories. Understanding this structure is essential for navigating the codebase and adding new features consistently.

## Root level files

- **package.json** - Project dependencies, scripts, and metadata
- **tsconfig.json** - TypeScript compiler configuration with path aliases
- **eslint.config.mjs** - ESLint configuration using flat config format
- **nodemon.json** - Development server configuration for hot reloading
- **Dockerfile** - Container configuration for deployment
- **ecosystem.config.js** - PM2 process manager configuration
- **README.md** - Project documentation and setup instructions

## Source code organization (src/)

### Core application files

- **app.ts** - Express application setup with middleware configuration
- **index.ts** - Server entry point and startup logic
- **type.d.ts** - Global TypeScript type declarations

### Configuration layer (config/)

- **cors.ts** - CORS policy configuration
- **dir.ts** - Directory path constants
- **environment.ts** - Environment variable validation and defaults
- **logger.ts** - Logging configuration and setup

### Constants layer (constants/)

- **domains.ts** - Domain-specific constants and URLs
- **enums.ts** - Application enumerations and status codes
- **httpStatus.ts** - HTTP status code constants
- **messages.ts** - User-facing messages and error text
- **regex.ts** - Regular expression patterns for validation

### Request handling layers

#### Routes (routes/)

- Pattern: `{feature}.routes.ts` (e.g., `workspaces.routes.ts`, `boards.routes.ts`)
- Purpose: Define API endpoints and middleware chains
- Structure: HTTP method routing with validation middleware

#### Middlewares (middlewares/)

- Pattern: `{feature}.middlewares.ts` + `common.middlewares.ts`
- Purpose: Request preprocessing, validation, and authentication
- Key files: `auth.middlewares.ts`, `error.middlewares.ts`, `common.middlewares.ts`

#### Controllers (controllers/)

- Pattern: `{feature}.controllers.ts`
- Purpose: Request handling and response formatting
- Structure: Extract request data → Call services → Format response

### Business logic layer (services/)

- Pattern: `{feature}.services.ts`
- Purpose: Business logic implementation and data access
- Key file: `database.services.ts` - Centralized database connection management
- Structure: Class-based services with singleton pattern

### Data layer (models/)

#### Schemas (models/schemas/)

- Pattern: `{Entity}.schema.ts`
- Purpose: Database schema definitions with TypeScript interfaces and classes
- Structure: Interface + Class pattern with default value management

#### Request types (models/requests/)

- Pattern: `{Entity}.requests.ts`
- Purpose: API request/response type definitions
- Structure: TypeScript interfaces for validation

### External integrations

#### Providers (providers/)

- **resend.ts** - Email service integration
- **unsplash.ts** - Image service for cover photos
- **uploadthing.ts** - File upload service integration

#### Templates (templates/)

- **board-invitation.html** - Email template for board invitations
- **forgot-password.html** - Password reset email template
- **verify-email.html** - Email verification template

### Real-time communication (sockets/)

- Pattern: `{feature}.sockets.ts`
- Purpose: Socket.IO event handlers for real-time features
- Structure: Feature-specific socket event management

### Utilities (utils/)

- **commons.ts** - General utility functions
- **crypto.ts** - Password hashing and security utilities
- **file.ts** - File processing and validation utilities
- **handlers.ts** - Request handler wrappers and error handling
- **jwt.ts** - JWT token management utilities
- **socket.ts** - Socket.IO helper functions
- **validation.ts** - Custom validation functions

## Documentation (memory-bank/)

- **activeContext.md** - Current development context and status
- **productContext.md** - Product requirements and user stories
- **progress.md** - Development progress tracking
- **projectbrief.md** - Project overview and objectives
- **systemPatterns.md** - Architecture patterns and conventions
- **techContext.md** - Technology stack and dependencies

## File naming conventions

- Use kebab-case for directories and files
- Feature-based naming: `{feature}.{layer}.ts`
- Schema files: `{Entity}.schema.ts` (PascalCase for entity names)
- Request types: `{Entity}.requests.ts`
- Utility files: descriptive names in camelCase

## Adding new features

1. **Routes**: Create `{feature}.routes.ts` with endpoint definitions
2. **Middlewares**: Create `{feature}.middlewares.ts` with validation logic
3. **Controllers**: Create `{feature}.controllers.ts` with request handlers
4. **Services**: Create `{feature}.services.ts` with business logic
5. **Models**: Add schema in `models/schemas/` and requests in `models/requests/`
6. **Sockets**: Add `{feature}.sockets.ts` if real-time features needed

## Architecture flow

```
Routes → Middlewares → Controllers → Services → Database
```

Each layer has specific responsibilities and dependencies flow downward only. This structure ensures maintainability and clear separation of concerns throughout the application.
