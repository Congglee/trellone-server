# TrellOne API - Technology Context

## Core Technology Stack

### Runtime & Framework

- **Node.js** - JavaScript runtime for server-side execution
- **TypeScript 5.8.2** - Latest stable TypeScript with modern ES features and type safety
- **Express.js 4.21.2** - Mature, stable web framework for REST API development
- **Socket.IO 4.8.1** - WebSocket library for real-time bidirectional communication

### Database & Data Layer

- **MongoDB 6.14.2** - NoSQL document database with latest driver improvements
- **MongoDB Driver** - Native MongoDB Node.js driver for database operations
- **Aggregation Pipeline** - Advanced querying capabilities for complex data operations

### Authentication & Security

- **JSON Web Tokens (JWT)** - Token-based authentication system
  - Access tokens (short-lived)
  - Refresh tokens (long-lived)
  - Special purpose tokens (email verification, password reset)
- **bcrypt via crypto** - Password hashing with salt for security
- **CORS** - Cross-Origin Resource Sharing configuration
- **express-validator 7.2.1** - Server-side validation and sanitization

### File Processing & Media

- **Sharp 0.33.5** - High-performance image processing (resize, format conversion)
- **Formidable 3.5.2** - File upload parsing with validation
- **UploadThing 7.6.0** - Modern file upload service integration
- **Unsplash API** - Integration for cover photo sourcing
- **MIME 4.0.6** - MIME type detection and validation

### Communication Services

- **Resend 4.2.0** - Modern email service for transactional emails
- **HTML Templates** - Custom email templates for verification and invitations

### Development Tools

- **ESLint 9.22.0** - Code linting with flat configuration
- **Prettier 3.5.3** - Code formatting and style consistency
- **Nodemon 3.1.9** - Development server with hot reload
- **TSX 4.19.3** - Fast TypeScript execution for development

### Utilities & Libraries

- **Lodash 4.17.21** - Utility functions for data manipulation
- **Axios 1.8.4** - HTTP client for external API integrations
- **ms 2.1.3** - Time parsing utility for JWT expiration
- **dotenv 16.4.7** - Environment variable management

## Development Environment

### Required Environment Variables

```bash
# Server Configuration
NODE_ENV=development|staging|production
PORT=4000
CLIENT_REDIRECT_CALLBACK=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/trellone
DB_USERS_COLLECTION=users
DB_BOARDS_COLLECTION=boards
DB_CARDS_COLLECTION=cards
DB_COLUMNS_COLLECTION=columns
DB_INVITATIONS_COLLECTION=invitations
DB_REFRESH_TOKENS_COLLECTION=refresh_tokens

# JWT Configuration
JWT_SECRET_ACCESS_TOKEN=your-access-token-secret
JWT_SECRET_REFRESH_TOKEN=your-refresh-token-secret
JWT_SECRET_EMAIL_VERIFY_TOKEN=your-email-verify-secret
JWT_SECRET_FORGOT_PASSWORD_TOKEN=your-forgot-password-secret
JWT_SECRET_INVITE_TOKEN=your-invite-token-secret

# JWT Expiration
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
EMAIL_VERIFY_TOKEN_EXPIRES_IN=24h
FORGOT_PASSWORD_TOKEN_EXPIRES_IN=1h
INVITE_TOKEN_EXPIRES_IN=7d

# Security
PASSWORD_SECRET=your-password-salt
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# External Services
RESEND_API_KEY=your-resend-api-key
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
UPLOADTHING_SECRET=your-uploadthing-secret
UPLOADTHING_APP_ID=your-uploadthing-app-id

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=your-google-redirect-uri
```

### Development Scripts

```json
{
  "dev": "cross-env NODE_ENV=development npx nodemon",
  "dev:prod": "cross-env NODE_ENV=production npx nodemon",
  "dev:stag": "cross-env NODE_ENV=staging npx nodemon",
  "build": "rimraf ./dist && tsc && tsc-alias",
  "start:dev": "cross-env NODE_ENV=development node dist/index.js",
  "start:prod": "cross-env NODE_ENV=production node dist/index.js",
  "start:stag": "cross-env NODE_ENV=staging node dist/index.js",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "prettier": "prettier --check .",
  "prettier:fix": "prettier --write ."
}
```

### Development Workflow

1. **Setup**: Install dependencies with `npm install`
2. **Environment**: Copy `.env.example` to `.env` and configure
3. **Database**: Start MongoDB instance (local or cloud)
4. **Development**: Run `npm run dev` for hot-reload server
5. **Linting**: Use `npm run lint` for code quality checks or `npm run lint:fix` for auto-fix
6. **Formatting**: Use `npm run prettier` for format checking or `npm run prettier:fix` for auto-format
7. **Production Testing**: Use `npm run dev:prod` to test production environment locally

## Project Structure Conventions

### File Naming Patterns

- **Routes**: `*.routes.ts` (e.g., `boards.routes.ts`)
- **Controllers**: `*.controllers.ts` (e.g., `boards.controllers.ts`)
- **Services**: `*.services.ts` (e.g., `boards.services.ts`)
- **Middlewares**: `*.middlewares.ts` (e.g., `auth.middlewares.ts`)
- **Schemas**: `*.schema.ts` (e.g., `User.schema.ts`)
- **Request Types**: `*.requests.ts` (e.g., `Board.requests.ts`)

### Directory Organization

```
src/
├── config/          # Application configuration
├── constants/       # Application constants and enums
├── controllers/     # Request handlers
├── middlewares/     # Request processing middleware
├── models/          # Data models and types
│   ├── schemas/     # Database schemas
│   └── requests/    # API request types
├── providers/       # External service integrations
├── routes/          # API route definitions
├── services/        # Business logic layer
├── sockets/         # Socket.IO event handlers
├── templates/       # Email templates
└── utils/           # Utility functions

.augment/
└── rules/           # Development guidelines and patterns
    ├── imported/    # Imported development rules and patterns
    └── *.md         # Specific development rules
```

## TypeScript Configuration

### Compiler Options

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "removeComments": true,
    "baseUrl": ".",
    "paths": {
      "~/*": ["src/*"]
    }
  }
}
```

### Type Safety Features

- Strict mode enabled for maximum type safety
- Path aliases for clean imports (`~/` maps to `src/`)
- Interface definitions for all request/response types
- Generic type parameters for reusable components
- Custom error classes with proper typing

## Database Design

### Connection Strategy

- Single connection instance through `database.services.ts`
- Connection pooling managed by MongoDB driver
- Environment-based connection configuration
- Graceful connection handling and error recovery

### Schema Patterns

- **Dual Interface + Class Pattern**: Every schema has both TypeScript interface and class
- **Default Value Management**: Classes handle default values consistently
- **ObjectId Handling**: Proper conversion between strings and ObjectIds
- **Soft Deletes**: `_destroy` flag instead of hard deletes
- **Audit Fields**: `created_at` and `updated_at` timestamps

### Collections

- `users` - User accounts and authentication data
- `boards` - Project boards with ownership and collaboration
- `columns` - Workflow columns within boards
- `cards` - Task cards within columns
- `invitations` - Board invitation management
- `refresh_tokens` - JWT refresh token storage

## Real-time Communication

### Socket.IO Configuration

```typescript
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  },
  transports: ['websocket', 'polling']
})
```

### Authentication Strategy

- Cookie-based authentication for Socket.IO connections
- Token verification middleware for all socket events
- User session management and tracking
- Room-based communication for board isolation

### Event Patterns

- Feature-specific event handlers in `src/sockets/`
- Consistent event naming conventions
- Error handling and validation for socket events
- Broadcast patterns for real-time updates

## Security Considerations

### Input Validation

- express-validator for all API endpoints
- Custom validation schemas for business logic
- File upload validation (type, size, count)
- SQL injection prevention through parameterized queries

### Authentication Security

- HTTP-only cookies for token storage
- Secure cookie settings in production
- Token rotation and invalidation
- Rate limiting and brute force protection

### Data Protection

- Password hashing with application-specific salt
- Sensitive data exclusion from API responses
- Environment variable protection
- CORS configuration for cross-origin security

## External Service Integration

### Email Service (Resend)

- Transactional email delivery
- HTML template rendering
- Delivery status tracking
- Error handling and retry logic

### File Upload (UploadThing)

- Secure file upload to cloud storage
- File validation and processing
- CDN distribution for performance
- Automatic cleanup of temporary files

### Image Service (Unsplash)

- Cover photo integration
- API rate limiting compliance
- Image metadata handling
- Fallback strategies for service outages

## Performance Considerations

### Database Optimization

- Efficient aggregation pipelines
- Proper indexing strategy
- Connection pooling
- Query optimization patterns

### File Processing

- Sharp for high-performance image processing
- Temporary file cleanup
- Streaming for large file uploads
- Memory usage optimization

### Caching Strategy

- JWT token validation caching
- Database query result caching
- Static asset caching
- Redis integration (future enhancement)

## Deployment Configuration

### Docker Deployment

The project includes a multi-stage Dockerfile for optimized production deployment:

```dockerfile
# Stage 1: Builder
FROM node:22-alpine3.22 AS builder
WORKDIR /home/node/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine3.22
WORKDIR /home/node/app
COPY --from=builder /home/node/app/dist ./dist
COPY --from=builder /home/node/app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 4000
CMD ["npm", "run", "start:prod"]
```

### PM2 Process Management

The project uses PM2 for process management in production:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'trellone-api-server',
      script: 'npm run start:prod'
    }
  ]
}
```

### Production Environment

- Node.js 22+ runtime (Alpine-based)
- MongoDB 6+ database
- SSL/TLS certificates for HTTPS
- Environment variable configuration
- Process management (PM2)
- Docker containerization

### Build Process

1. TypeScript compilation (`tsc`)
2. Path alias resolution (`tsc-alias`)
3. Asset copying and optimization
4. Environment configuration validation
5. Production bundle creation
6. Docker image building

### Monitoring & Logging

- Structured logging with configurable levels
- Error tracking and alerting
- Performance monitoring
- Health check endpoints

## Development Constraints

### Technical Debt

- Lodash dependency for utility functions (consider tree-shaking)
- Manual cookie parsing in Socket.IO authentication
- Limited test coverage (improvement needed)

### Known Limitations

- Single MongoDB instance (no sharding)
- In-memory session storage for Socket.IO
- Limited file upload size (3MB per file)
- No built-in caching layer

### Future Enhancements

- Redis integration for caching and sessions
- Database replica sets for high availability
- Microservice architecture for scaling
- Advanced monitoring and analytics
- API documentation with Swagger/OpenAPI
