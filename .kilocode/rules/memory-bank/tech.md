# TrellOne API - Tech Stack

## Core Technology Stack

### Runtime & Framework

- **Node.js** with **TypeScript 5.8.2** - Latest stable TypeScript with modern ES features
- **Express.js 4.21.2** - Mature, stable web framework for Node.js
- **MongoDB 6.14.2** - Latest MongoDB driver with improved performance and security

### Real-time Communication

- **Socket.IO 4.8.1** - WebSocket library for real-time bidirectional communication

## Key Dependencies

### Server & Database

- **Express 4.21.2** - Web framework
- **MongoDB 6.14.2** - Database driver
- **CORS 2.8.5** - Cross-origin resource sharing
- **Cookie-parser 1.4.7** - Cookie parsing middleware
- **Compression 1.8.0** - Response compression

### Authentication & Security

- **jsonwebtoken 9.0.2** - JWT token implementation
- **express-validator 7.2.1** - Input validation middleware
- **crypto** (Node.js built-in) - Password hashing with salt

### File Processing & Media

- **formidable 3.5.2** - File upload parsing
- **sharp 0.33.5** - High-performance image processing
- **uploadthing 7.6.0** - Modern file upload service
- **mime 4.0.6** - MIME type detection

### External Services

- **resend 4.2.0** - Modern email service
- **unsplash-js 7.0.19** - Unsplash API integration
- **axios 1.8.4** - HTTP client for external APIs

### Utilities

- **lodash 4.17.21** - Utility functions
- **ms 2.1.3** - Time parsing utility
- **dotenv 16.4.7** - Environment variable loading
- **chalk 4.1.2** - Terminal string styling for logging

## Development Tools

### TypeScript & Build

- **TypeScript 5.8.2** - Type-safe JavaScript
- **tsx 4.19.3** - Fast TypeScript execution
- **tsc-alias 1.8.11** - Path alias resolution
- **rimraf 6.0.1** - Cross-platform rm -rf

### Code Quality

- **ESLint 9.22.0** - Code linting with flat config
- **Prettier 3.5.3** - Code formatting
- **eslint-config-prettier 10.1.1** - ESLint-Prettier integration
- **eslint-plugin-prettier 5.2.3** - Prettier as ESLint plugin
- **typescript-eslint 8.26.1** - TypeScript-specific ESLint rules
- **globals 16.0.0** - Global variables for ESLint

### Development Server

- **nodemon 3.1.9** - Development server with hot reload
- **cross-env 7.0.3** - Cross-platform environment variables

## Development Setup

### Environment Variables

```bash
# Server Configuration
NODE_ENV=development
PORT=4000
HOST=http://localhost

# Database Configuration
DB_NAME=trellone
DB_USERNAME=your-username
DB_PASSWORD=your-password
DB_WORKSPACES_COLLECTION=workspaces
DB_BOARDS_COLLECTION=boards
DB_COLUMNS_COLLECTION=columns
DB_CARDS_COLLECTION=cards
DB_USERS_COLLECTION=users
DB_REFRESH_TOKENS_COLLECTION=refresh_tokens
DB_INVITATIONS_COLLECTION=invitations

# Security Configuration
PASSWORD_SECRET=your-salt

# JWT Token Configuration
JWT_SECRET_ACCESS_TOKEN=your-secret
JWT_SECRET_REFRESH_TOKEN=your-secret
JWT_SECRET_EMAIL_VERIFY_TOKEN=your-secret
JWT_SECRET_FORGOT_PASSWORD_TOKEN=your-secret
JWT_SECRET_INVITE_TOKEN=your-secret

# Token Expiration
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
EMAIL_VERIFY_TOKEN_EXPIRES_IN=7d
FORGOT_PASSWORD_TOKEN_EXPIRES_IN=7d
INVITE_TOKEN_EXPIRES_IN=7d

# OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=your-redirect-uri
CLIENT_REDIRECT_CALLBACK=your-callback-url

# Client Configuration
CLIENT_URL=http://localhost:3000

# External Services
RESEND_API_KEY=your-key
RESEND_EMAIL_FROM_ADDRESS=your-email
UPLOADTHING_TOKEN=your-token
UNSPLASH_ACCESS_KEY=your-key
UNSPLASH_SECRET_KEY=your-secret
UNSPLASH_APPLICATION_ID=your-app-id
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

## Architecture Implementation

### Database Connection

- **MongoDB Atlas**: Cloud-hosted MongoDB with connection string authentication
- **Environment-based Configuration**: Separate database configurations per environment
- **Connection Pooling**: Automatic connection management via MongoDB driver
- **Collection Management**: Centralized collection access through DatabaseService

### Authentication Architecture

- **Multi-token Strategy**: Separate JWT secrets for different token types
- **Cookie + Header Authentication**: Priority-based token extraction
- **Socket Authentication**: Cookie-based authentication for real-time connections
- **Role-based Access Control**: Workspace and board-level permissions

### Real-time Communication

- **Socket.IO Integration**: WebSocket communication with authentication middleware
- **Room-based Communication**: Board-specific event broadcasting
- **Event Handlers**: Feature-specific socket event management
- **Connection Management**: User session tracking and cleanup

## Performance Optimizations

### Database Operations

- **Aggregation Pipelines**: Complex queries with MongoDB aggregation
- **Parallel Operations**: Promise.all for independent database operations
- **Efficient Queries**: Optimized workspace and board relationship queries
- **Proper Indexing**: Strategic database indexing for performance

### File Processing

- **Sharp Integration**: High-performance image processing and optimization
- **Temporary File Management**: Automatic cleanup of processed files
- **External Storage**: UploadThing integration for scalable file storage
- **MIME Validation**: Security-focused file type validation

### Real-time Performance

- **Event Optimization**: Efficient socket event handling and broadcasting
- **Room Management**: Targeted message delivery to specific board rooms
- **Connection Cleanup**: Proper session management and resource cleanup

## Security Implementation

### Input Validation

- **express-validator**: Comprehensive input validation for all endpoints
- **Custom Validators**: Business logic validation in middleware layer
- **File Upload Security**: MIME type and size validation
- **SQL Injection Prevention**: Parameterized queries and ObjectId validation

### Authentication Security

- **JWT Implementation**: Secure token generation with separate secrets
- **Password Security**: Salt-based hashing with crypto module
- **Token Rotation**: Refresh token mechanism for enhanced security
- **CORS Configuration**: Environment-based origin control

### Authorization

- **Role-based Access**: Workspace Admin/Normal and Board Admin/Member/Observer roles
- **Resource Authorization**: Middleware-based permission validation
- **Hierarchical Permissions**: Workspace membership determines board access

## Production Considerations

### Deployment Configuration

- **Docker Support**: Containerization with Dockerfile
- **PM2 Configuration**: Process management with ecosystem.config.js
- **Environment Separation**: Development, staging, and production configurations
- **Health Monitoring**: Built-in logging and error tracking

### Scalability Patterns

- **Layered Architecture**: Clean separation of concerns for maintainability
- **Service Layer Pattern**: Business logic encapsulation
- **Repository Pattern**: Centralized database access
- **Microservice Ready**: Architecture supports future service decomposition

## Current Technical Constraints

### Infrastructure Limitations

- **Single MongoDB Instance**: No sharding or replica sets currently configured
- **In-memory Socket Sessions**: No external session store (Redis) integration
- **File Upload Limits**: 3MB per file restriction
- **No Caching Layer**: Direct database queries without caching

### Future Enhancement Opportunities

- **Redis Integration**: Session storage and caching layer
- **Database Clustering**: Replica sets for high availability
- **CDN Integration**: Enhanced file delivery performance
- **Monitoring Stack**: Advanced application performance monitoring
- **Rate Limiting**: API request throttling and abuse prevention

This technology stack provides a robust, production-ready foundation for the TrellOne API with modern development practices, comprehensive security measures, and scalable architecture patterns.
