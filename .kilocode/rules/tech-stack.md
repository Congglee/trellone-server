## Brief overview

This rule defines the technology stack, specific versions, and best practices for the TrellOne API project. These guidelines ensure consistent development practices and leverage version-specific features and security improvements.

## Core runtime and framework

- **Node.js with TypeScript 5.8.2** - Use latest TypeScript features including improved type inference and performance optimizations
- **Express.js 4.21.2** - Stable LTS version with security patches, use async/await patterns consistently
- **MongoDB 6.14.2** - Latest driver with improved connection pooling and aggregation performance

## Development tooling

- **ESLint 9.22.0** - Use flat config format (eslint.config.mjs) instead of legacy .eslintrc
- **Prettier 3.5.3** - Integrated with ESLint via eslint-config-prettier for consistent formatting
- **nodemon 3.1.9** - Development server with TypeScript support via tsx
- **tsx 4.19.3** - Fast TypeScript execution for development, replaces ts-node
- **tsc-alias 1.8.11** - Required for path alias resolution in compiled output

## Authentication and security

- **jsonwebtoken 9.0.2** - Use separate secrets for access and refresh tokens, implement proper token rotation
- **express-validator 7.2.1** - Chain validation middleware, use custom validators for business logic
- **crypto (Node.js built-in)** - Use for password hashing with application-specific salt

## Real-time communication

- **Socket.IO 4.8.1** - Use room-based communication for board isolation, implement proper authentication middleware
- Leverage connection state management and event acknowledgments for reliability

## File processing and media

- **sharp 0.33.5** - High-performance image processing, use for resizing and optimization before upload
- **formidable 3.5.2** - Secure file upload parsing with size and type validation
- **mime 4.0.6** - MIME type detection for security validation

## External service integrations

- **resend 4.2.0** - Modern email service, use HTML templates for consistent branding
- **uploadthing 7.6.0** - File upload service with automatic CDN distribution
- **unsplash-js 7.0.19** - Image service integration for cover photos
- **axios 1.8.4** - HTTP client for external API calls with proper error handling

## Database and utilities

- **mongodb 6.14.2** - Use aggregation pipelines for complex queries, leverage connection pooling
- **lodash 4.17.21** - Utility functions, prefer specific imports to reduce bundle size
- **ms 2.1.3** - Time parsing for JWT expiration and other time-based operations

## Version-specific best practices

- **TypeScript 5.8.2** - Use satisfies operator for better type inference, leverage const assertions
- **Express 4.21.2** - Use async error handling with express-async-errors or custom wrappers
- **ESLint 9.22.0** - Migrate to flat config, use typescript-eslint 8.26.1 for TypeScript-specific rules
- **MongoDB 6.14.2** - Use stable API versioning, implement proper connection error handling

## Development workflow

- Use `npm run dev` for development with hot reload via nodemon
- Use `npm run build` for production builds with path alias resolution
- Implement proper environment variable validation using dotenv 16.4.7
- Use cross-env 7.0.3 for cross-platform environment variable setting

## Security considerations

- Keep dependencies updated, especially security-critical packages like jsonwebtoken and express
- Use express-validator for all input validation before processing
- Implement proper CORS configuration using cors 2.8.5
- Use compression 1.8.0 for response optimization in production
