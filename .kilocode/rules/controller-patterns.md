# Controller Patterns and Conventions

## Brief overview

This rule documents the established patterns, conventions, and best practices for defining, implementing, and utilizing controllers in the TrellOne Express.js application. These guidelines ensure consistency, maintainability, and proper separation of concerns across all controller implementations.

## File organization and naming

- Controller files follow the pattern `{feature}.controllers.ts` using kebab-case
- Each controller file exports named functions using the pattern `{action}{Feature}Controller`
- Controllers are organized by domain/feature in the `src/controllers/` directory
- Import order: Express types → External libraries → Internal modules (config, constants, models, services)
- Use path aliases (`~/`) for all internal imports to maintain clean import statements

## Function signature patterns

- All controller functions must be async and return Promise<void> implicitly
- Use Express Request and Response types with TypeScript generics for type safety
- Apply specific typing: `Request<ParamsDictionary, any, RequestBodyType>` or `Request<ParamsType, any, BodyType, QueryType>`
- Parameter destructuring should be done within the function body, not in the signature
- Controllers should not have explicit return type annotations (rely on TypeScript inference)

## Request data extraction patterns

- Extract user authentication data: `const { user_id } = req.decoded_authorization as TokenPayload`
- Extract route parameters: `const { resource_id } = req.params`
- Extract request body: Use `req.body` directly or destructure specific fields
- Extract query parameters: `const limit = Number(req.query.limit)` with explicit type conversion
- Access middleware-attached resources: `const resource = req.resource as ResourceType`

## Response formatting conventions

- Use standardized response format: `{ message: string, result?: any }`
- Import success messages from constants: `FEATURE_MESSAGES.ACTION_SUCCESS`
- For list endpoints, include pagination metadata: `{ items, limit, page, total_page }`
- Calculate total_page using: `Math.ceil(result.total / limit)`
- Return responses using: `return res.json({ message, result })`

## Authentication and authorization patterns

- Extract user_id from JWT tokens: `req.decoded_authorization as TokenPayload`
- Handle different token types: `req.decoded_refresh_token`, `req.decoded_email_verify_token`
- Use optional chaining for conditional auth: `req.decoded_authorization?.user_id as string`
- Cast ObjectId when needed: `const user_id = user._id as ObjectId`

## Cookie management implementation

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

## Service layer integration

- Delegate all business logic to corresponding service classes
- Call services with extracted and validated data: `await serviceInstance.method(params)`
- Pass complete request objects only when file processing is required
- Maintain clean separation: Controllers handle HTTP concerns, Services handle business logic

## Error handling approach

- Controllers should not contain try-catch blocks (handled by `wrapRequestHandler`)
- Use early returns for validation failures with appropriate HTTP status codes
- Return error responses using: `res.status(HTTP_STATUS.CODE).json({ message })`
- Let service layer errors bubble up to be caught by the error handler wrapper

## Type safety implementation

- Import request/response types from `~/models/requests/`
- Use generic Request types: `Request<ParamsType, any, BodyType, QueryType>`
- Cast middleware-attached objects with proper typing: `req.resource as ResourceType`
- Maintain type safety throughout the request/response lifecycle

## Resource access patterns

- Access validated resources attached by middleware: `req.user`, `req.board`, `req.workspace`
- Extract nested properties when needed: `(req.card as Card & { column_id: string }).column_id`
- Use spread operator for resource responses: `const result = { ...req.resource }`

## Pagination handling conventions

- Extract pagination parameters: `const limit = Number(req.query.limit)`, `const page = Number(req.query.page)`
- Pass pagination to services: `{ user_id, limit, page, keyword }`
- Format paginated responses with metadata including total_page calculation
- Use consistent pagination parameter names across all endpoints

## Special endpoint patterns

- File upload endpoints: Pass entire request object to service for multipart handling
- OAuth endpoints: Handle query parameters and redirect responses with URL construction
- Support endpoints: Use descriptive paths like `/supports/moving-card` for complex operations
- Verification endpoints: Extract token data and handle verification state checks

## HTTP method conventions

- **POST**: Create operations return `{ message, result }` with created resource
- **GET**: Retrieve operations return resource data or paginated lists
- **PUT/PATCH**: Update operations return `{ message, result }` with updated resource
- **DELETE**: Delete operations return `{ message }` without result data

## Controller testing considerations

- Controllers should be pure functions that can be easily unit tested
- All external dependencies (services, database) should be injected or mocked
- Request/response objects should be easily mockable for testing
- Business logic should be in services, making controllers thin and testable
