# Service Layer Patterns and Conventions

## Brief overview

This rule documents the established patterns, conventions, and best practices for defining, implementing, and consuming services within the TrellOne Express.js application. These guidelines ensure consistency, maintainability, and proper separation of concerns across all service implementations.

## File organization and naming

- Service files follow the pattern `{feature}.services.ts` using kebab-case
- Each service file exports a single default service instance
- Services are organized by domain/feature in the `src/services/` directory
- Import order: External libraries → Internal modules (config, constants, models, providers, other services)
- Use path aliases (`~/`) for all internal imports to maintain clean import statements

## Class-based service architecture

- All services are implemented as ES6 classes with descriptive names ending in "Service"
- Use singleton pattern: instantiate once and export the instance as default
- Private methods use `private` keyword for internal utilities and helper functions
- Public methods are `async` and handle business logic operations
- Method naming follows camelCase with descriptive action-oriented names

## Service instantiation pattern

- Create class instance immediately after class definition
- Export instance as default: `export default serviceName`
- Use consistent variable naming: `{feature}Service` (e.g., `authService`, `boardsService`)
- Services are stateless - no instance variables that change between requests

## Database integration conventions

- All database operations go through the centralized `databaseService`
- Use `databaseService.{collection}` for MongoDB collection access
- Apply proper ObjectId conversion when working with MongoDB documents
- Use MongoDB aggregation pipelines for complex queries with joins
- Handle database errors at the service level, not in controllers

## Business logic encapsulation

- Services contain all business logic and data transformation
- Controllers should only extract request data, call services, and format responses
- Complex operations are broken down into private helper methods within services
- Services handle validation of business rules beyond basic input validation
- Data processing and calculations are performed in services, not controllers

## Service interdependency management

- Services can import and use other services when needed
- Avoid circular dependencies between services
- Use dependency injection pattern when services need other services
- Import services at the top level, not within methods
- Keep service dependencies minimal and well-defined

## Error handling patterns

- Services throw descriptive errors using `ErrorWithStatus` class
- Let errors bubble up to be caught by controller error handlers
- Use appropriate HTTP status codes in error objects
- Provide meaningful error messages from constants files
- Handle external service errors and transform them appropriately

## External service integration

- Encapsulate all external API calls within service methods
- Use provider modules for external service configurations
- Handle external service failures gracefully with proper error messages
- Abstract external service complexity from controllers
- Use async/await for all external service calls

## Authentication and authorization patterns

- Token generation and verification logic resides in `AuthService`
- Use private methods for token signing with different types
- Store decoded token data in request objects for downstream use
- Handle JWT errors with proper status codes and messages
- Separate access token and refresh token logic clearly

## Data transformation conventions

- Transform database documents to appropriate response formats in services
- Use MongoDB aggregation for complex data joining and transformation
- Apply proper field projection to exclude sensitive data
- Handle array transformations and nested object manipulations
- Convert ObjectIds to strings when necessary for API responses

## Async operation management

- All service methods are async and return Promises
- Use `Promise.all()` for parallel independent operations
- Handle sequential operations with proper await chains
- Use proper error handling for async operations
- Avoid blocking operations in service methods

## File upload and media handling

- Media processing logic is encapsulated in `MediasService`
- Use Sharp for image processing and optimization
- Handle file cleanup after upload operations
- Integrate with external upload services through service layer
- Validate file types and sizes within service methods

## Service method signatures

- Use descriptive parameter names and TypeScript interfaces
- Accept structured objects rather than multiple primitive parameters
- Return consistent response formats with proper typing
- Use optional parameters with default values when appropriate
- Document complex method parameters with TypeScript types

## Testing and maintainability

- Services should be easily unit testable in isolation
- Avoid direct database connections in favor of `databaseService`
- Keep methods focused on single responsibilities
- Use dependency injection to make services mockable
- Maintain clear separation between public and private methods
