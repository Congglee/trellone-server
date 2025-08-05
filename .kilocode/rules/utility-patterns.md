# Utility Function Patterns and Conventions

## Brief overview

This rule documents the established patterns, conventions, and best practices for defining, organizing, and consuming utility functions within the TrellOne Express.js application. These guidelines ensure consistency, maintainability, modularity, and reusability across all utility implementations while maintaining type safety and testability.

## File organization and naming

- Utility files follow descriptive naming: `{purpose}.ts` (e.g., `crypto.ts`, `validation.ts`, `file.ts`)
- Each utility file serves a single, well-defined purpose or domain
- Utilities are organized in the `src/utils/` directory with clear separation of concerns
- Import order: Node.js built-ins → External libraries → Internal modules using path aliases
- Use path aliases (`~/`) for all internal imports to maintain clean import statements

## Export patterns and conventions

- Use named exports for individual utility functions: `export const functionName = ()`
- Use default exports for main utility instances or primary functions when appropriate
- Export TypeScript types and interfaces alongside utility functions when needed
- Maintain consistent export patterns within each utility file
- Group related exports together and document complex utilities with JSDoc comments

## Type safety implementation

- All utility functions must have explicit TypeScript parameter and return types
- Use generic types where appropriate for reusable utility functions
- Import and use proper types from external libraries and internal modules
- Leverage TypeScript's type inference while maintaining explicit typing for public APIs
- Define custom types and interfaces for complex utility function parameters

## Error handling patterns

- Utility functions should throw descriptive errors using custom error classes
- Use `ErrorWithStatus` for HTTP-specific errors with appropriate status codes
- Handle external library errors and transform them into application-specific errors
- Provide meaningful error messages using constants from message files
- Let errors bubble up to be caught by higher-level error handlers

## Modularity and single responsibility

- Each utility file focuses on a single domain or responsibility
- Functions within utilities should be focused and do one thing well
- Avoid cross-domain dependencies between utility files
- Extract common patterns into reusable utility functions
- Keep utility functions pure and side-effect free when possible

## Reusability and composition

- Design utility functions to be reusable across different parts of the application
- Use higher-order functions and function composition where appropriate
- Avoid hardcoding values; accept parameters for configuration
- Create generic utilities that can work with different data types
- Document utility function usage patterns and examples

## External dependency management

- Handle dynamic imports for optional dependencies: `const formidable = (await import('formidable')).default`
- Use proper error handling for external service integrations
- Abstract external library complexity behind clean utility interfaces
- Handle version-specific features and compatibility issues
- Cache expensive operations and external library instances when appropriate

## Async operation patterns

- All async utility functions should use async/await syntax consistently
- Return Promises with proper typing for async operations
- Use Promise.all() for parallel independent operations
- Handle Promise rejections with proper error transformation
- Avoid blocking operations in utility functions

## Configuration and environment handling

- Access configuration through centralized config modules
- Use environment variables through the config layer, not directly
- Provide sensible defaults for optional configuration parameters
- Validate configuration parameters in utility functions when needed
- Keep environment-specific logic isolated and configurable

## Testing and maintainability considerations

- Write utility functions to be easily unit testable in isolation
- Avoid direct dependencies on external services in core utilities
- Use dependency injection patterns for testable utilities
- Keep functions pure and deterministic when possible
- Provide clear interfaces that can be easily mocked

## Performance optimization patterns

- Use efficient algorithms and data structures in utility functions
- Implement caching strategies for expensive operations when appropriate
- Avoid unnecessary object creation and memory allocations
- Use streaming for large file operations and data processing
- Profile and optimize critical utility functions

## Security implementation

- Validate all input parameters in utility functions
- Use secure defaults for cryptographic operations
- Sanitize and normalize data consistently
- Handle sensitive data (passwords, tokens) with appropriate security measures
- Implement proper cleanup for temporary files and resources

## Documentation and usage patterns

- Document complex utility functions with clear JSDoc comments
- Provide usage examples for non-trivial utility functions
- Document side effects and dependencies clearly
- Maintain consistent parameter naming and ordering conventions
- Use descriptive variable names that explain the purpose and data flow
