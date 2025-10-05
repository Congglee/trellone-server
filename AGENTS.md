# Trellone API - Architecture & Patterns Documentation

Trellone API is a TypeScript Express backend for a Trello‑style collaboration app that provides secure authentication, real‑time updates, and a maintainable layered architecture, enabling teams to organize work into workspaces, boards, columns, and cards with consistent validation, role‑based access, and reliable persistence.

---

## Project Structure

### Brief overview

This rule outlines the directory structure and important files for the Trellone API project. The project follows a layered architecture pattern with clear separation of concerns across different directories. Understanding this structure is essential for navigating the codebase and adding new features consistently.

### Root level files

- **package.json** - Project dependencies, scripts, and metadata
- **tsconfig.json** - TypeScript compiler configuration with path aliases
- **eslint.config.mjs** - ESLint configuration using flat config format
- **nodemon.json** - Development server configuration for hot reloading
- **Dockerfile** - Container configuration for deployment
- **ecosystem.config.js** - PM2 process manager configuration
- **README.md** - Project documentation and setup instructions

### Source code organization (src/)

#### Core application files

- **app.ts** - Express application setup with middleware configuration
- **index.ts** - Server entry point and startup logic
- **type.d.ts** - Global TypeScript type declarations

#### Configuration layer (config/)

- **cors.ts** - CORS policy configuration
- **dir.ts** - Directory path constants
- **environment.ts** - Environment variable validation and defaults
- **logger.ts** - Logging configuration and setup

#### Constants layer (constants/)

- **domains.ts** - Domain-specific constants and URLs
- **enums.ts** - Application enumerations and status codes
- **httpStatus.ts** - HTTP status code constants
- **messages.ts** - User-facing messages and error text
- **regex.ts** - Regular expression patterns for validation

#### Request handling layers

##### Routes (routes/)

- Pattern: `{feature}.routes.ts` (e.g., `workspaces.routes.ts`, `boards.routes.ts`)
- Purpose: Define API endpoints and middleware chains
- Structure: HTTP method routing with validation middleware

##### Middlewares (middlewares/)

- Pattern: `{feature}.middlewares.ts` + `common.middlewares.ts`
- Purpose: Request preprocessing, validation, and authentication
- Key files: `auth.middlewares.ts`, `error.middlewares.ts`, `common.middlewares.ts`

##### Controllers (controllers/)

- Pattern: `{feature}.controllers.ts`
- Purpose: Request handling and response formatting
- Structure: Extract request data → Call services → Format response

#### Business logic layer (services/)

- Pattern: `{feature}.services.ts`
- Purpose: Business logic implementation and data access
- Key file: `database.services.ts` - Centralized database connection management
- Structure: Class-based services with singleton pattern

#### Data layer (models/)

##### Schemas (models/schemas/)

- Pattern: `{Entity}.schema.ts`
- Purpose: Database schema definitions with TypeScript interfaces and classes
- Structure: Interface + Class pattern with default value management

##### Request types (models/requests/)

- Pattern: `{Entity}.requests.ts`
- Purpose: API request/response type definitions
- Structure: TypeScript interfaces for validation

#### External integrations

##### Providers (providers/)

- **resend.ts** - Email service integration
- **unsplash.ts** - Image service for cover photos
- **uploadthing.ts** - File upload service integration

##### Templates (templates/)

- **board-invitation.html** - Email template for board invitations
- **forgot-password.html** - Password reset email template
- **verify-email.html** - Email verification template

#### Real-time communication (sockets/)

- Pattern: `{feature}.sockets.ts`
- Purpose: Socket.IO event handlers for real-time features
- Structure: Feature-specific socket event management

#### Utilities (utils/)

- **commons.ts** - General utility functions
- **crypto.ts** - Password hashing and security utilities
- **file.ts** - File processing and validation utilities
- **handlers.ts** - Request handler wrappers and error handling
- **jwt.ts** - JWT token management utilities
- **socket.ts** - Socket.IO helper functions
- **validation.ts** - Custom validation functions

### File naming conventions

- Use kebab-case for directories and files
- Feature-based naming: `{feature}.{layer}.ts`
- Schema files: `{Entity}.schema.ts` (PascalCase for entity names)
- Request types: `{Entity}.requests.ts`
- Utility files: descriptive names in camelCase

### Adding new features

1. **Routes**: Create `{feature}.routes.ts` with endpoint definitions
2. **Middlewares**: Create `{feature}.middlewares.ts` with validation logic
3. **Controllers**: Create `{feature}.controllers.ts` with request handlers
4. **Services**: Create `{feature}.services.ts` with business logic
5. **Models**: Add schema in `models/schemas/` and requests in `models/requests/`
6. **Sockets**: Add `{feature}.sockets.ts` if real-time features needed

### Architecture flow

```
Routes → Middlewares → Controllers → Services → Database
```

Each layer has specific responsibilities and dependencies flow downward only. This structure ensures maintainability and clear separation of concerns throughout the application.

---

## API Routes Layers Pattern

### Brief overview

This rule documents the established patterns, conventions, and best practices for defining, organizing, and consuming API routes in the Trellone Express.js application. These guidelines ensure consistency, maintainability, and proper separation of concerns across all route definitions.

### File organization and naming

- Route files follow the pattern `{feature}.routes.ts` using kebab-case
- Each route file exports a default router instance
- Router variables use camelCase: `{feature}Router` (e.g., `authRouter`, `boardsRouter`)
- Route files are organized by domain/feature in the `src/routes/` directory
- Import order: Express Router → Controllers → Middlewares → Types → Utils

### Route definition patterns

- Use Express Router instances for modular route organization
- Apply middleware chains in consistent order: Authentication → Validation → Filtering → Controller
- Wrap all controllers with `wrapRequestHandler` for centralized error handling
- Use TypeScript imports with path aliases (`~/controllers/`, `~/middlewares/`)
- Group related routes within the same router file

### Middleware chaining conventions

- **Authentication first**: `accessTokenValidator` for protected routes
- **User verification**: `verifiedUserValidator` for verified user requirements
- **Resource validation**: Feature-specific ID validators (e.g., `boardIdValidator`, `cardIdValidator`)
- **Input validation**: Feature-specific validators for request body/query validation
- **Body filtering**: `filterMiddleware<Type>([...fields])` to whitelist allowed fields
- **Controller execution**: Always wrap with `wrapRequestHandler(controller)`

### Authentication patterns

- Use `accessTokenValidator` for all protected routes
- Apply `verifiedUserValidator` for routes requiring email verification
- Public routes (like login, register) don't require authentication middleware
- OAuth routes follow the pattern `/oauth/{provider}`

### Request validation approach

- Create feature-specific middleware files (e.g., `boards.middlewares.ts`)
- Use descriptive validator names: `{action}{Feature}Validator` (e.g., `createBoardValidator`)
- Apply resource ID validators for parameterized routes
- Validate query parameters with dedicated validators (e.g., `paginationValidator`)

### Body filtering implementation

- Use `filterMiddleware<RequestType>([...allowedFields])` to whitelist request body fields
- Import request types from `~/models/requests/` for type safety
- Apply filtering after validation but before controller execution
- Define allowed fields arrays in request type files when reused

### Controller integration

- Import controllers from corresponding controller files
- Use descriptive controller names: `{action}{Feature}Controller`
- Always wrap controllers with `wrapRequestHandler` for error handling
- Controllers should be the last item in the middleware chain

### Route mounting strategy

- Mount routes in `app.ts` with clear, hierarchical prefixes
- Follow domain hierarchy: `/workspaces` → `/boards` → `/columns` → `/cards`
- Use semantic prefixes that reflect the resource structure
- Mount authentication routes at `/auth` prefix
- Mount utility routes (media, invitations) with descriptive prefixes

### HTTP method conventions

- **POST**: Create new resources (e.g., `POST /boards`)
- **GET**: Retrieve resources (e.g., `GET /boards/:board_id`)
- **PUT**: Update entire resources (e.g., `PUT /boards/:board_id`)
- **PATCH**: Partial updates (e.g., `PATCH /users/me`)
- **DELETE**: Remove resources (e.g., `DELETE /cards/:card_id`)

### Special route patterns

- Support routes use descriptive paths: `/supports/moving-card`
- Nested resource operations: `/:parent_id/child/:child_id/action`
- Verification routes: `/verify-{action}` for token-based operations
- Utility routes: `/upload-{type}` for file operations

### Error handling integration

- All routes must use `wrapRequestHandler` for consistent error handling
- Error handling middleware (`defaultErrorHandler`) mounted last in app.ts
- Validation errors handled automatically by express-validator middleware
- Custom errors thrown in controllers are caught by the wrapper

### TypeScript integration

- Import request/response types from `~/models/requests/`
- Use generic types with `filterMiddleware<RequestType>`
- Maintain type safety throughout the middleware chain
- Export router with proper TypeScript typing

---

## Controller Patterns and Conventions

### Brief overview

This rule documents the established patterns, conventions, and best practices for defining, implementing, and utilizing controllers in the Trellone Express.js application. These guidelines ensure consistency, maintainability, and proper separation of concerns across all controller implementations.

### File organization and naming

- Controller files follow the pattern `{feature}.controllers.ts` using kebab-case
- Each controller file exports named functions using the pattern `{action}{Feature}Controller`
- Controllers are organized by domain/feature in the `src/controllers/` directory
- Import order: Express types → External libraries → Internal modules (config, constants, models, services)
- Use path aliases (`~/`) for all internal imports to maintain clean import statements

### Function signature patterns

- All controller functions must be async and return Promise<void> implicitly
- Use Express Request and Response types with TypeScript generics for type safety
- Apply specific typing: `Request<ParamsDictionary, any, RequestBodyType>` or `Request<ParamsType, any, BodyType, QueryType>`
- Parameter destructuring should be done within the function body, not in the signature
- Controllers should not have explicit return type annotations (rely on TypeScript inference)

### Request data extraction patterns

- Extract user authentication data: `const { user_id } = req.decoded_authorization as TokenPayload`
- Extract route parameters: `const { resource_id } = req.params`
- Extract request body: Use `req.body` directly or destructure specific fields
- Extract query parameters: `const limit = Number(req.query.limit)` with explicit type conversion
- Access middleware-attached resources: `const resource = req.resource as ResourceType`

### Response formatting conventions

- Use standardized response format: `{ message: string, result?: any }`
- Import success messages from constants: `FEATURE_MESSAGES.ACTION_SUCCESS`
- For list endpoints, include pagination metadata: `{ items, limit, page, total_page }`
- Calculate total_page using: `Math.ceil(result.total / limit)`
- Return responses using: `return res.json({ message, result })`

### Authentication and authorization patterns

- Extract user_id from JWT tokens: `req.decoded_authorization as TokenPayload`
- Handle different token types: `req.decoded_refresh_token`, `req.decoded_email_verify_token`
- Use optional chaining for conditional auth: `req.decoded_authorization?.user_id as string`
- Cast ObjectId when needed: `const user_id = user._id as ObjectId`

### Cookie management implementation

- Set authentication cookies with consistent security settings:
  ```typescript
  res.cookie('token_name', token_value, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('7 days')
  })
  ```
- Clear cookies on logout: `res.clearCookie('token_name')`
- Use `ms()` utility for time-based expiration values

### Service layer integration

- Delegate all business logic to corresponding service classes
- Call services with extracted and validated data: `await serviceInstance.method(params)`
- Pass complete request objects only when file processing is required
- Maintain clean separation: Controllers handle HTTP concerns, Services handle business logic

### Error handling approach

- Controllers should not contain try-catch blocks (handled by `wrapRequestHandler`)
- Use early returns for validation failures with appropriate HTTP status codes
- Return error responses using: `res.status(HTTP_STATUS.CODE).json({ message })`
- Let service layer errors bubble up to be caught by the error handler wrapper

### Type safety implementation

- Import request/response types from `~/models/requests/`
- Use generic Request types: `Request<ParamsType, any, BodyType, QueryType>`
- Cast middleware-attached objects with proper typing: `req.resource as ResourceType`
- Maintain type safety throughout the request/response lifecycle

### Resource access patterns

- Access validated resources attached by middleware: `req.user`, `req.board`, `req.workspace`
- Extract nested properties when needed: `(req.card as Card & { column_id: string }).column_id`
- Use spread operator for resource responses: `const result = { ...req.resource }`

### Pagination handling conventions

- Extract pagination parameters: `const limit = Number(req.query.limit)`, `const page = Number(req.query.page)`
- Pass pagination to services: `{ user_id, limit, page, keyword }`
- Format paginated responses with metadata including total_page calculation
- Use consistent pagination parameter names across all endpoints

### Special endpoint patterns

- File upload endpoints: Pass entire request object to service for multipart handling
- OAuth endpoints: Handle query parameters and redirect responses with URL construction
- Support endpoints: Use descriptive paths like `/supports/moving-card` for complex operations
- Verification endpoints: Extract token data and handle verification state checks

### HTTP method conventions

- **POST**: Create operations return `{ message, result }` with created resource
- **GET**: Retrieve operations return resource data or paginated lists
- **PUT/PATCH**: Update operations return `{ message, result }` with updated resource
- **DELETE**: Delete operations return `{ message }` without result data

### Controller testing considerations

- Controllers should be pure functions that can be easily unit tested
- All external dependencies (services, database) should be injected or mocked
- Request/response objects should be easily mockable for testing
- Business logic should be in services, making controllers thin and testable

---

## Middleware Patterns and Conventions

### Brief overview

This rule documents the established patterns, conventions, and best practices for defining, organizing, and utilizing middleware functions in the Trellone Express.js application. These guidelines ensure consistency, maintainability, and proper separation of concerns across all middleware implementations.

### File organization and naming

- Middleware files follow the pattern `{feature}.middlewares.ts` using kebab-case
- Each middleware file exports named validator functions
- Common middleware patterns are centralized in `common.middlewares.ts`
- Error handling middleware is isolated in `error.middlewares.ts`
- Import order: Express types → express-validator → External libraries → Internal modules

### Validation middleware patterns

- Use `express-validator` with `checkSchema` for all input validation
- Wrap all validators with the `validate` utility function from `~/utils/validation`
- Define reusable schema objects with `ParamSchema` type for common fields
- Apply validation to specific request parts using the third parameter: `['body']`, `['params']`, `['query']`, `['headers']`
- Use descriptive validator names: `{action}{Feature}Validator` (e.g., `createBoardValidator`, `updateCardValidator`)

### Schema definition conventions

- Extract common validation schemas as reusable constants (e.g., `passwordSchema`, `boardTitleSchema`)
- Use consistent validation patterns: `notEmpty`, `isString`, `trim`, `isLength`, `custom`
- Apply `trim: true` for string fields to normalize input
- Define length constraints with descriptive error messages
- Use `optional: true` for non-required fields and remove `notEmpty` constraint

### Custom validation patterns

- Implement business logic validation in `custom` validators
- Use async/await for database lookups within custom validators
- Attach validated entities to the request object for downstream use: `(req as Request).entity = entity`
- Throw descriptive errors for validation failures
- Use `ErrorWithStatus` for HTTP status-specific errors in custom validators

### Authentication middleware architecture

- Implement token extraction with fallback priority: Cookies → Authorization header
- Use separate validators for different token types: `accessTokenValidator`, `refreshTokenValidator`
- Apply `verifiedUserValidator` for routes requiring email verification
- Store decoded token data in request object: `req.decoded_authorization`
- Handle JWT errors with proper status codes and capitalized messages

### Resource validation patterns

- Create resource-specific ID validators (e.g., `boardIdValidator`, `cardIdValidator`)
- Verify resource existence and user permissions in the same validator
- Use MongoDB aggregation pipelines for complex resource fetching with related data
- Implement proper authorization checks: membership validation, ownership verification
- Store validated resources in request object for controller access

### Error handling integration

- Use `ErrorWithStatus` class for HTTP-specific errors with status codes
- Implement centralized error handling with `defaultErrorHandler`
- Handle `JsonWebTokenError` specifically with capitalized messages
- Use `wrapRequestHandler` for controller error catching
- Provide descriptive error messages from constants files

### Middleware chaining conventions

- Follow consistent middleware order: Authentication → Resource Validation → Input Validation → Body Filtering → Controller
- Apply `accessTokenValidator` first for protected routes
- Use feature-specific validators after authentication
- Apply `filterMiddleware` before controllers to whitelist allowed fields
- Always wrap controllers with `wrapRequestHandler` as the final step

### Request body filtering

- Use `filterMiddleware<RequestType>([...allowedFields])` to whitelist request body fields
- Import request types from `~/models/requests/` for type safety
- Apply filtering after validation but before controller execution
- Define allowed fields arrays in request type files when reused across routes

### Complex validation scenarios

- Handle nested object validation with proper field checking (e.g., comment, member, attachment objects)
- Validate action-based operations with enum constraints
- Implement conditional validation based on action types
- Use array validation with element-level ObjectId checking
- Validate relationships between entities (e.g., card-column-board hierarchy)

### Database integration patterns

- Use `databaseService` for all database operations within middleware
- Implement efficient queries with proper indexing considerations
- Use `countDocuments` for existence/permission checks when full document isn't needed
- Apply MongoDB aggregation for complex data fetching with joins
- Handle ObjectId validation before database queries

### Type safety implementation

- Use TypeScript interfaces for all request/response types
- Apply generic types with `filterMiddleware<RequestType>`
- Maintain type safety throughout the middleware chain
- Use proper type assertions: `(req as Request).property`
- Import and use `TokenPayload` type for decoded JWT data

### Reusable middleware components

- Create utility middleware for common operations (pagination, filtering)
- Export reusable schema objects for consistent validation
- Implement generic middleware functions with type parameters
- Use higher-order functions for configurable middleware behavior
- Centralize common validation patterns in shared modules

### Performance considerations

- Use `countDocuments` instead of `findOne` when only checking existence
- Implement efficient aggregation pipelines with proper stage ordering
- Apply early validation to fail fast on invalid input
- Use parallel operations with `Promise.all` when possible
- Cache frequently accessed validation data when appropriate

### Security middleware patterns

- Validate all user input before processing
- Implement proper authorization checks at the middleware level
- Use parameterized queries to prevent injection attacks
- Validate file uploads with MIME type and size constraints
- Sanitize and normalize input data consistently

---

## MongoDB Schema and TypeScript Type Patterns

### Brief overview

This rule documents the established patterns, conventions, and best practices for defining, structuring, and utilizing MongoDB schemas and TypeScript types within the Trellone Express.js application. These guidelines ensure consistency, maintainability, and type safety across the data layer while following the dual interface + class pattern for schema definitions.

### Schema definition architecture

- Use dual interface + class pattern for all MongoDB schemas
- Define TypeScript interface first with optional fields for constructor parameters
- Implement ES6 class that handles default values and data transformation
- Export class as default export for consistent importing across the application
- Interface naming follows `{Entity}Schema` pattern (e.g., `UserSchema`, `BoardSchema`)
- Class naming follows `{Entity}` pattern matching the collection name

### Interface design patterns

- Mark `_id` as optional (`_id?: ObjectId`) since MongoDB generates it automatically
- Use optional fields (`field?: type`) for constructor parameters that have defaults
- Required fields in interface match business requirements, not implementation defaults
- Import ObjectId from 'mongodb' package for all ID field types
- Import enum types from `~/constants/enums` for type safety
- Import complex nested types from `~/models/Extensions` for reusability

### Class implementation conventions

- All schema classes implement constructor pattern with single parameter object
- Constructor parameter uses the corresponding interface type
- Create single `date` variable for consistent timestamp assignment
- Assign `_id` directly without transformation (MongoDB handles generation)
- Apply default values using logical OR operator (`||`) for optional fields
- Use meaningful defaults: empty strings for text, empty arrays for collections, false for booleans
- Handle enum defaults by referencing the enum's default value
- Maintain consistent field ordering: ID → Core fields → Optional fields → System fields

### Default value management

- String fields default to empty string (`''`) when not provided
- Boolean fields default to `false` for flags, `true` for active states
- Array fields default to empty array (`[]`) for collections
- Object fields default to `null` for optional references
- Enum fields default to the most restrictive or initial enum value
- Date fields use constructor-created date for `created_at` and `updated_at`
- Soft delete flag `_destroy` always defaults to `false`

### ObjectId handling patterns

- Use `ObjectId` type from 'mongodb' package for all ID fields
- Reference fields use `ObjectId` type (e.g., `user_id: ObjectId`)
- Array of IDs use `ObjectId[]` type (e.g., `column_order_ids: ObjectId[]`)
- Optional ID references use `ObjectId | null` for explicit null handling
- Never use string type for ID fields in schema classes
- Convert string IDs to ObjectId in service layer, not in schemas

### Nested object and array patterns

- Define complex nested types in `~/models/Extensions.ts` for reusability
- Import nested types into schema files rather than defining inline
- Use array types for collections (e.g., `members: BoardMember[]`)
- Handle nested objects with proper TypeScript interfaces
- Default nested arrays to empty arrays in constructor
- Default nested objects to appropriate empty state or null

### Soft delete implementation

- Include `_destroy?: boolean` in all entity interfaces
- Default `_destroy` to `false` in all schema constructors
- Use consistent naming across all schemas for soft delete flag
- Never hard delete records; always use soft delete pattern
- Query conditions should always check `_destroy: false` for active records

### Timestamp management

- Include `created_at?: Date` and `updated_at?: Date` in all schemas
- Mark timestamps as optional in interface (MongoDB handles them)
- Set both timestamps to same date value in constructor for new records
- Use `$currentDate: { updated_at: true }` in update operations
- Never manually set `updated_at` in application code

### Request type organization

- Separate request types into feature-specific files in `~/models/requests/`
- Use descriptive naming: `Create{Entity}ReqBody`, `Update{Entity}ReqBody`
- Extend interfaces when update types build upon create types
- Define parameter types extending `ParamsDictionary` for route parameters
- Create query interfaces extending base query types for search functionality
- Export filter field arrays for middleware integration

### Type safety enforcement

- Use strict TypeScript interfaces for all request/response types
- Leverage enum types from constants for validation and type safety
- Extend base types like `JwtPayload` for token-related interfaces
- Use generic types where appropriate for reusable patterns
- Apply proper typing for Express route parameters and query strings
- Maintain type consistency between schemas and request types

### Extension types pattern

- Define reusable nested types in `~/models/Extensions.ts`
- Use descriptive interface names for complex nested objects
- Include all required fields with proper typing
- Handle ObjectId fields consistently in extension types
- Document complex nested structures with clear field purposes
- Export all extension types for use across schema definitions

### Import organization

- Import ObjectId from 'mongodb' first
- Import enums from `~/constants/enums` second
- Import extension types from `~/models/Extensions` third
- Use path aliases (`~/`) for all internal imports
- Group related imports together for readability
- Maintain consistent import order across all schema files

### Validation integration

- Schema classes provide runtime type safety through constructors
- Validation logic belongs in middleware layer, not in schemas
- Use schema types in validation middleware for consistency
- Apply business rule validation in custom middleware validators
- Leverage TypeScript interfaces for compile-time type checking
- Maintain separation between data structure and validation logic

### Database service integration

- Schema classes integrate seamlessly with MongoDB collections
- Use schema constructors when inserting new documents
- Apply proper typing in database service collection getters
- Maintain type safety throughout database operations
- Handle ObjectId conversion consistently in service layer
- Use schema types for aggregation pipeline result typing

---

## Service Layer Patterns and Conventions

### Brief overview

This rule documents the established patterns, conventions, and best practices for defining, implementing, and consuming services within the Trellone Express.js application. These guidelines ensure consistency, maintainability, and proper separation of concerns across all service implementations.

### File organization and naming

- Service files follow the pattern `{feature}.services.ts` using kebab-case
- Each service file exports a single default service instance
- Services are organized by domain/feature in the `src/services/` directory
- Import order: External libraries → Internal modules (config, constants, models, providers, other services)
- Use path aliases (`~/`) for all internal imports to maintain clean import statements

### Class-based service architecture

- All services are implemented as ES6 classes with descriptive names ending in "Service"
- Use singleton pattern: instantiate once and export the instance as default
- Private methods use `private` keyword for internal utilities and helper functions
- Public methods are `async` and handle business logic operations
- Method naming follows camelCase with descriptive action-oriented names

### Service instantiation pattern

- Create class instance immediately after class definition
- Export instance as default: `export default serviceName`
- Use consistent variable naming: `{feature}Service` (e.g., `authService`, `boardsService`)
- Services are stateless - no instance variables that change between requests

### Database integration conventions

- All database operations go through the centralized `databaseService`
- Use `databaseService.{collection}` for MongoDB collection access
- Apply proper ObjectId conversion when working with MongoDB documents
- Use MongoDB aggregation pipelines for complex queries with joins
- Handle database errors at the service level, not in controllers

### Business logic encapsulation

- Services contain all business logic and data transformation
- Controllers should only extract request data, call services, and format responses
- Complex operations are broken down into private helper methods within services
- Services handle validation of business rules beyond basic input validation
- Data processing and calculations are performed in services, not controllers

### Service interdependency management

- Services can import and use other services when needed
- Avoid circular dependencies between services
- Use dependency injection pattern when services need other services
- Import services at the top level, not within methods
- Keep service dependencies minimal and well-defined

### Error handling patterns

- Services throw descriptive errors using `ErrorWithStatus` class
- Let errors bubble up to be caught by controller error handlers
- Use appropriate HTTP status codes in error objects
- Provide meaningful error messages from constants files
- Handle external service errors and transform them appropriately

### External service integration

- Encapsulate all external API calls within service methods
- Use provider modules for external service configurations
- Handle external service failures gracefully with proper error messages
- Abstract external service complexity from controllers
- Use async/await for all external service calls

### Authentication and authorization patterns

- Token generation and verification logic resides in `AuthService`
- Use private methods for token signing with different types
- Store decoded token data in request objects for downstream use
- Handle JWT errors with proper status codes and messages
- Separate access token and refresh token logic clearly

### Data transformation conventions

- Transform database documents to appropriate response formats in services
- Use MongoDB aggregation for complex data joining and transformation
- Apply proper field projection to exclude sensitive data
- Handle array transformations and nested object manipulations
- Convert ObjectIds to strings when necessary for API responses

### Async operation management

- All service methods are async and return Promises
- Use `Promise.all()` for parallel independent operations
- Handle sequential operations with proper await chains
- Use proper error handling for async operations
- Avoid blocking operations in service methods

### File upload and media handling

- Media processing logic is encapsulated in `MediasService`
- Use Sharp for image processing and optimization
- Handle file cleanup after upload operations
- Integrate with external upload services through service layer
- Validate file types and sizes within service methods

### Service method signatures

- Use descriptive parameter names and TypeScript interfaces
- Accept structured objects rather than multiple primitive parameters
- Return consistent response formats with proper typing
- Use optional parameters with default values when appropriate
- Document complex method parameters with TypeScript types

### Testing and maintainability

- Services should be easily unit testable in isolation
- Avoid direct database connections in favor of `databaseService`
- Keep methods focused on single responsibilities
- Use dependency injection to make services mockable
- Maintain clear separation between public and private methods

---

## Utility Function Patterns and Conventions

### Brief overview

This rule documents the established patterns, conventions, and best practices for defining, organizing, and consuming utility functions within the Trellone Express.js application. These guidelines ensure consistency, maintainability, modularity, and reusability across all utility implementations while maintaining type safety and testability.

### File organization and naming

- Utility files follow descriptive naming: `{purpose}.ts` (e.g., `crypto.ts`, `validation.ts`, `file.ts`)
- Each utility file serves a single, well-defined purpose or domain
- Utilities are organized in the `src/utils/` directory with clear separation of concerns
- Import order: Node.js built-ins → External libraries → Internal modules using path aliases
- Use path aliases (`~/`) for all internal imports to maintain clean import statements

### Export patterns and conventions

- Use named exports for individual utility functions: `export const functionName = ()`
- Use default exports for main utility instances or primary functions when appropriate
- Export TypeScript types and interfaces alongside utility functions when needed
- Maintain consistent export patterns within each utility file
- Group related exports together and document complex utilities with JSDoc comments

### Type safety implementation

- All utility functions must have explicit TypeScript parameter and return types
- Use generic types where appropriate for reusable utility functions
- Import and use proper types from external libraries and internal modules
- Leverage TypeScript's type inference while maintaining explicit typing for public APIs
- Define custom types and interfaces for complex utility function parameters

### Error handling patterns

- Utility functions should throw descriptive errors using custom error classes
- Use `ErrorWithStatus` for HTTP-specific errors with appropriate status codes
- Handle external library errors and transform them into application-specific errors
- Provide meaningful error messages using constants from message files
- Let errors bubble up to be caught by higher-level error handlers

### Modularity and single responsibility

- Each utility file focuses on a single domain or responsibility
- Functions within utilities should be focused and do one thing well
- Avoid cross-domain dependencies between utility files
- Extract common patterns into reusable utility functions
- Keep utility functions pure and side-effect free when possible

### Reusability and composition

- Design utility functions to be reusable across different parts of the application
- Use higher-order functions and function composition where appropriate
- Avoid hardcoding values; accept parameters for configuration
- Create generic utilities that can work with different data types
- Document utility function usage patterns and examples

### External dependency management

- Handle dynamic imports for optional dependencies: `const formidable = (await import('formidable')).default`
- Use proper error handling for external service integrations
- Abstract external library complexity behind clean utility interfaces
- Handle version-specific features and compatibility issues
- Cache expensive operations and external library instances when appropriate

### Async operation patterns

- All async utility functions should use async/await syntax consistently
- Return Promises with proper typing for async operations
- Use Promise.all() for parallel independent operations
- Handle Promise rejections with proper error transformation
- Avoid blocking operations in utility functions

### Configuration and environment handling

- Access configuration through centralized config modules
- Use environment variables through the config layer, not directly
- Provide sensible defaults for optional configuration parameters
- Validate configuration parameters in utility functions when needed
- Keep environment-specific logic isolated and configurable

### Testing and maintainability considerations

- Write utility functions to be easily unit testable in isolation
- Avoid direct dependencies on external services in core utilities
- Use dependency injection patterns for testable utilities
- Keep functions pure and deterministic when possible
- Provide clear interfaces that can be easily mocked

### Performance optimization patterns

- Use efficient algorithms and data structures in utility functions
- Implement caching strategies for expensive operations when appropriate
- Avoid unnecessary object creation and memory allocations
- Use streaming for large file operations and data processing
- Profile and optimize critical utility functions

### Security implementation

- Validate all input parameters in utility functions
- Use secure defaults for cryptographic operations
- Sanitize and normalize data consistently
- Handle sensitive data (passwords, tokens) with appropriate security measures
- Implement proper cleanup for temporary files and resources

### Documentation and usage patterns

- Document complex utility functions with clear JSDoc comments
- Provide usage examples for non-trivial utility functions
- Document side effects and dependencies clearly
- Maintain consistent parameter naming and ordering conventions
- Use descriptive variable names that explain the purpose and data flow

---
