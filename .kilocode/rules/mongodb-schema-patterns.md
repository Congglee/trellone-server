# MongoDB Schema and TypeScript Type Patterns

## Brief overview

This rule documents the established patterns, conventions, and best practices for defining, structuring, and utilizing MongoDB schemas and TypeScript types within the TrellOne Express.js application. These guidelines ensure consistency, maintainability, and type safety across the data layer while following the dual interface + class pattern for schema definitions.

## Schema definition architecture

- Use dual interface + class pattern for all MongoDB schemas
- Define TypeScript interface first with optional fields for constructor parameters
- Implement ES6 class that handles default values and data transformation
- Export class as default export for consistent importing across the application
- Interface naming follows `{Entity}Schema` pattern (e.g., `UserSchema`, `BoardSchema`)
- Class naming follows `{Entity}` pattern matching the collection name

## Interface design patterns

- Mark `_id` as optional (`_id?: ObjectId`) since MongoDB generates it automatically
- Use optional fields (`field?: type`) for constructor parameters that have defaults
- Required fields in interface match business requirements, not implementation defaults
- Import ObjectId from 'mongodb' package for all ID field types
- Import enum types from `~/constants/enums` for type safety
- Import complex nested types from `~/models/Extensions` for reusability

## Class implementation conventions

- All schema classes implement constructor pattern with single parameter object
- Constructor parameter uses the corresponding interface type
- Create single `date` variable for consistent timestamp assignment
- Assign `_id` directly without transformation (MongoDB handles generation)
- Apply default values using logical OR operator (`||`) for optional fields
- Use meaningful defaults: empty strings for text, empty arrays for collections, false for booleans
- Handle enum defaults by referencing the enum's default value
- Maintain consistent field ordering: ID → Core fields → Optional fields → System fields

## Default value management

- String fields default to empty string (`''`) when not provided
- Boolean fields default to `false` for flags, `true` for active states
- Array fields default to empty array (`[]`) for collections
- Object fields default to `null` for optional references
- Enum fields default to the most restrictive or initial enum value
- Date fields use constructor-created date for `created_at` and `updated_at`
- Soft delete flag `_destroy` always defaults to `false`

## ObjectId handling patterns

- Use `ObjectId` type from 'mongodb' package for all ID fields
- Reference fields use `ObjectId` type (e.g., `user_id: ObjectId`)
- Array of IDs use `ObjectId[]` type (e.g., `column_order_ids: ObjectId[]`)
- Optional ID references use `ObjectId | null` for explicit null handling
- Never use string type for ID fields in schema classes
- Convert string IDs to ObjectId in service layer, not in schemas

## Nested object and array patterns

- Define complex nested types in `~/models/Extensions.ts` for reusability
- Import nested types into schema files rather than defining inline
- Use array types for collections (e.g., `members: BoardMember[]`)
- Handle nested objects with proper TypeScript interfaces
- Default nested arrays to empty arrays in constructor
- Default nested objects to appropriate empty state or null

## Soft delete implementation

- Include `_destroy?: boolean` in all entity interfaces
- Default `_destroy` to `false` in all schema constructors
- Use consistent naming across all schemas for soft delete flag
- Never hard delete records; always use soft delete pattern
- Query conditions should always check `_destroy: false` for active records

## Timestamp management

- Include `created_at?: Date` and `updated_at?: Date` in all schemas
- Mark timestamps as optional in interface (MongoDB handles them)
- Set both timestamps to same date value in constructor for new records
- Use `$currentDate: { updated_at: true }` in update operations
- Never manually set `updated_at` in application code

## Request type organization

- Separate request types into feature-specific files in `~/models/requests/`
- Use descriptive naming: `Create{Entity}ReqBody`, `Update{Entity}ReqBody`
- Extend interfaces when update types build upon create types
- Define parameter types extending `ParamsDictionary` for route parameters
- Create query interfaces extending base query types for search functionality
- Export filter field arrays for middleware integration

## Type safety enforcement

- Use strict TypeScript interfaces for all request/response types
- Leverage enum types from constants for validation and type safety
- Extend base types like `JwtPayload` for token-related interfaces
- Use generic types where appropriate for reusable patterns
- Apply proper typing for Express route parameters and query strings
- Maintain type consistency between schemas and request types

## Extension types pattern

- Define reusable nested types in `~/models/Extensions.ts`
- Use descriptive interface names for complex nested objects
- Include all required fields with proper typing
- Handle ObjectId fields consistently in extension types
- Document complex nested structures with clear field purposes
- Export all extension types for use across schema definitions

## Import organization

- Import ObjectId from 'mongodb' first
- Import enums from `~/constants/enums` second
- Import extension types from `~/models/Extensions` third
- Use path aliases (`~/`) for all internal imports
- Group related imports together for readability
- Maintain consistent import order across all schema files

## Validation integration

- Schema classes provide runtime type safety through constructors
- Validation logic belongs in middleware layer, not in schemas
- Use schema types in validation middleware for consistency
- Apply business rule validation in custom middleware validators
- Leverage TypeScript interfaces for compile-time type checking
- Maintain separation between data structure and validation logic

## Database service integration

- Schema classes integrate seamlessly with MongoDB collections
- Use schema constructors when inserting new documents
- Apply proper typing in database service collection getters
- Maintain type safety throughout database operations
- Handle ObjectId conversion consistently in service layer
- Use schema types for aggregation pipeline result typing
