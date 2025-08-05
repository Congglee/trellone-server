# Middleware Patterns and Conventions

## Brief overview

This rule documents the established patterns, conventions, and best practices for defining, organizing, and utilizing middleware functions in the TrellOne Express.js application. These guidelines ensure consistency, maintainability, and proper separation of concerns across all middleware implementations.

## File organization and naming

- Middleware files follow the pattern `{feature}.middlewares.ts` using kebab-case
- Each middleware file exports named validator functions
- Common middleware patterns are centralized in `common.middlewares.ts`
- Error handling middleware is isolated in `error.middlewares.ts`
- Import order: Express types → express-validator → External libraries → Internal modules

## Validation middleware patterns

- Use `express-validator` with `checkSchema` for all input validation
- Wrap all validators with the `validate` utility function from `~/utils/validation`
- Define reusable schema objects with `ParamSchema` type for common fields
- Apply validation to specific request parts using the third parameter: `['body']`, `['params']`, `['query']`, `['headers']`
- Use descriptive validator names: `{action}{Feature}Validator` (e.g., `createBoardValidator`, `updateCardValidator`)

## Schema definition conventions

- Extract common validation schemas as reusable constants (e.g., `passwordSchema`, `boardTitleSchema`)
- Use consistent validation patterns: `notEmpty`, `isString`, `trim`, `isLength`, `custom`
- Apply `trim: true` for string fields to normalize input
- Define length constraints with descriptive error messages
- Use `optional: true` for non-required fields and remove `notEmpty` constraint

## Custom validation patterns

- Implement business logic validation in `custom` validators
- Use async/await for database lookups within custom validators
- Attach validated entities to the request object for downstream use: `(req as Request).entity = entity`
- Throw descriptive errors for validation failures
- Use `ErrorWithStatus` for HTTP status-specific errors in custom validators

## Authentication middleware architecture

- Implement token extraction with fallback priority: Cookies → Authorization header
- Use separate validators for different token types: `accessTokenValidator`, `refreshTokenValidator`
- Apply `verifiedUserValidator` for routes requiring email verification
- Store decoded token data in request object: `req.decoded_authorization`
- Handle JWT errors with proper status codes and capitalized messages

## Resource validation patterns

- Create resource-specific ID validators (e.g., `boardIdValidator`, `cardIdValidator`)
- Verify resource existence and user permissions in the same validator
- Use MongoDB aggregation pipelines for complex resource fetching with related data
- Implement proper authorization checks: membership validation, ownership verification
- Store validated resources in request object for controller access

## Error handling integration

- Use `ErrorWithStatus` class for HTTP-specific errors with status codes
- Implement centralized error handling with `defaultErrorHandler`
- Handle `JsonWebTokenError` specifically with capitalized messages
- Use `wrapRequestHandler` for controller error catching
- Provide descriptive error messages from constants files

## Middleware chaining conventions

- Follow consistent middleware order: Authentication → Resource Validation → Input Validation → Body Filtering → Controller
- Apply `accessTokenValidator` first for protected routes
- Use feature-specific validators after authentication
- Apply `filterMiddleware` before controllers to whitelist allowed fields
- Always wrap controllers with `wrapRequestHandler` as the final step

## Request body filtering

- Use `filterMiddleware<RequestType>([...allowedFields])` to whitelist request body fields
- Import request types from `~/models/requests/` for type safety
- Apply filtering after validation but before controller execution
- Define allowed fields arrays in request type files when reused across routes

## Complex validation scenarios

- Handle nested object validation with proper field checking (e.g., comment, member, attachment objects)
- Validate action-based operations with enum constraints
- Implement conditional validation based on action types
- Use array validation with element-level ObjectId checking
- Validate relationships between entities (e.g., card-column-board hierarchy)

## Database integration patterns

- Use `databaseService` for all database operations within middleware
- Implement efficient queries with proper indexing considerations
- Use `countDocuments` for existence/permission checks when full document isn't needed
- Apply MongoDB aggregation for complex data fetching with joins
- Handle ObjectId validation before database queries

## Type safety implementation

- Use TypeScript interfaces for all request/response types
- Apply generic types with `filterMiddleware<RequestType>`
- Maintain type safety throughout the middleware chain
- Use proper type assertions: `(req as Request).property`
- Import and use `TokenPayload` type for decoded JWT data

## Reusable middleware components

- Create utility middleware for common operations (pagination, filtering)
- Export reusable schema objects for consistent validation
- Implement generic middleware functions with type parameters
- Use higher-order functions for configurable middleware behavior
- Centralize common validation patterns in shared modules

## Performance considerations

- Use `countDocuments` instead of `findOne` when only checking existence
- Implement efficient aggregation pipelines with proper stage ordering
- Apply early validation to fail fast on invalid input
- Use parallel operations with `Promise.all` when possible
- Cache frequently accessed validation data when appropriate

## Security middleware patterns

- Validate all user input before processing
- Implement proper authorization checks at the middleware level
- Use parameterized queries to prevent injection attacks
- Validate file uploads with MIME type and size constraints
- Sanitize and normalize input data consistently
