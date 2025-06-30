# TrellOne API - System Patterns

## Architecture Overview

### Layered Architecture Pattern

TrellOne follows a strict layered architecture with clear separation of concerns:

```
Routes → Middlewares → Controllers → Services → Database
```

Each layer has specific responsibilities and dependencies flow downward only.

### Layer Responsibilities

#### 1. Routes Layer (`src/routes/`)

- **Purpose**: Define API endpoints and middleware chains
- **Files**: `*.routes.ts` (e.g., `boards.routes.ts`, `users.routes.ts`)
- **Responsibilities**:
  - HTTP method routing (GET, POST, PUT, DELETE)
  - Middleware chain orchestration
  - Request handler wrapping with `wrapRequestHandler`

#### 2. Middlewares Layer (`src/middlewares/`)

- **Purpose**: Request preprocessing, validation, and authentication
- **Files**: `*.middlewares.ts` (e.g., `auth.middlewares.ts`, `boards.middlewares.ts`)
- **Responsibilities**:
  - Authentication and authorization
  - Input validation using express-validator
  - Request body filtering
  - Custom business logic validation

#### 3. Controllers Layer (`src/controllers/`)

- **Purpose**: Request handling and business logic coordination
- **Files**: `*.controllers.ts` (e.g., `boards.controllers.ts`, `users.controllers.ts`)
- **Responsibilities**:
  - Extract data from requests
  - Coordinate service layer calls
  - Format and return responses
  - Cookie management for authentication

#### 4. Services Layer (`src/services/`)

- **Purpose**: Business logic implementation and data access
- **Files**: `*.services.ts` (e.g., `boards.services.ts`, `auth.services.ts`)
- **Responsibilities**:
  - Business logic implementation
  - Database operations
  - External service integrations
  - Transaction management

#### 5. Database Layer (`src/services/database.services.ts`)

- **Purpose**: Database connection and collection management
- **Responsibilities**:
  - MongoDB connection management
  - Collection access patterns
  - Database configuration

## Design Patterns

### 1. Service Layer Pattern

Each business domain has a dedicated service class:

```typescript
class BoardsService {
  async createBoard(data: CreateBoardReqBody) {}
  async getBoards(params: GetBoardsParams) {}
  async updateBoard(id: string, data: UpdateBoardReqBody) {}
}

const boardsService = new BoardsService()
export default boardsService
```

### 2. Repository Pattern (via Database Service)

Centralized database access through a single service:

```typescript
class DatabaseService {
  get users(): Collection<User> {}
  get boards(): Collection<Board> {}
  get cards(): Collection<Card> {}
}
```

### 3. Factory Pattern (Schema Creation)

Consistent object creation using schema classes:

```typescript
// Interface for input validation
interface UserSchema {
  email: string
  password: string
  display_name?: string
}

// Class for object creation with defaults
export default class User {
  constructor(user: UserSchema) {
    this.email = user.email
    this.display_name = user.display_name || ''
    this.created_at = new Date()
  }
}
```

### 4. Middleware Chain Pattern

Consistent middleware ordering across all routes:

```typescript
router.put(
  '/:board_id',
  accessTokenValidator, // Authentication
  boardIdValidator, // Resource validation
  updateBoardValidator, // Input validation
  filterMiddleware(['title', 'description']), // Body filtering
  wrapRequestHandler(updateBoardController) // Controller
)
```

### 5. Error Handling Pattern

Centralized error handling with custom error classes:

```typescript
// Custom error classes
export class ErrorWithStatus extends Error {
  status: number
  constructor({ message, status }: { message: string; status: number }) {
    super(message)
    this.status = status
  }
}

// Middleware error handler
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json(omit(err, ['status']))
  }
  // Handle other errors...
}
```

## Data Flow Patterns

### 1. Request Flow

```
HTTP Request → Route → Auth Middleware → Validation → Controller → Service → Database
```

### 2. Response Flow

```
Database → Service → Controller → HTTP Response
```

### 3. Real-time Flow (Socket.IO)

```
Client Action → Socket Event → Service → Database → Broadcast to Clients
```

## Authentication Architecture

### 1. JWT Token Strategy

- **Access Tokens**: Short-lived (15 minutes) for API access
- **Refresh Tokens**: Long-lived (7 days) for token renewal
- **Special Tokens**: Email verification, password reset, board invitations

### 2. Token Storage Patterns

```typescript
// Dual storage: Cookies + Headers
// Priority 1: HTTP-only cookies (preferred)
// Priority 2: Authorization header (fallback)
```

### 3. Authorization Flow

```
Request → Extract Token (Cookie/Header) → Verify Token → Attach User Data → Proceed
```

## Database Patterns

### 1. Schema Definition Pattern

Every collection follows the dual interface + class pattern:

- **Interface**: Input validation and optional fields
- **Class**: Object creation with defaults and required fields

### 2. ObjectId Conversion Pattern

```typescript
// Always convert string IDs to ObjectId for database operations
const user_id = new ObjectId(user_id_string)
const board_id = new ObjectId(body.board_id)
```

### 3. Aggregation Pipeline Pattern

Complex queries use MongoDB aggregation:

```typescript
const pipeline = [
  { $match: { user_id: new ObjectId(user_id) } },
  { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
  { $unwind: '$user' },
  { $sort: { created_at: -1 } }
]
```

### 4. Soft Delete Pattern

```typescript
// Mark as deleted instead of removing
{ $set: { _destroy: true }, $currentDate: { updated_at: true } }
```

## Real-time Architecture

### 1. Socket.IO Integration

```typescript
// Server-side socket management
const io = new Server(httpServer, { cors: corsOptions })

// Authentication middleware for sockets
io.use(async (socket, next) => {
  // Cookie-based authentication
  const access_token = extractTokenFromCookies(socket.handshake.headers.cookie)
  // Verify and attach user data
})
```

### 2. Room-based Communication

```typescript
// Users join board-specific rooms
socket.join(`board:${boardId}`)

// Broadcast to specific board
io.to(`board:${boardId}`).emit('boardUpdate', data)
```

### 3. Event Handling Pattern

```typescript
// Feature-specific socket handlers
socket.on('updateBoard', async (data) => {
  // Validate data
  // Update database
  // Broadcast to room
})
```

## File Upload Architecture

### 1. Multi-step Processing

```
Upload → Temporary Storage → Processing (Sharp) → External Service (UploadThing) → Cleanup
```

### 2. File Validation Pattern

```typescript
const form = formidable({
  uploadDir: UPLOAD_TEMP_DIR,
  maxFiles: 4,
  maxFileSize: 3000 * 1024,
  filter: ({ mimetype }) => mimetype?.includes('image/')
})
```

### 3. Image Processing Pipeline

```typescript
// Sharp processing chain
await sharp(inputPath).resize(800, 600, { fit: 'inside' }).jpeg({ quality: 85 }).toFile(outputPath)
```

## External Service Integration

### 1. Provider Pattern

Each external service has a dedicated provider:

- `resend.ts` - Email service
- `uploadthing.ts` - File upload service
- `unsplash.ts` - Image service

### 2. Service Abstraction

```typescript
// Abstract external service complexity
export const sendVerifyRegisterEmail = async (email: string, token: string) => {
  // Handle email template, API calls, error handling
}
```

## Validation Patterns

### 1. Express-Validator Integration

```typescript
// Schema-based validation
export const createBoardValidator = validate(
  checkSchema(
    {
      title: { notEmpty: true, isString: true, trim: true },
      description: { optional: true, isString: true }
    },
    ['body']
  )
)
```

### 2. Custom Validation Pattern

```typescript
// Business logic validation in schemas
custom: {
  options: async (value, { req }) => {
    // Database checks
    // Business rule validation
    // Attach data to request
    return true
  }
}
```

## Security Patterns

### 1. Input Sanitization

```typescript
// Filter middleware removes unwanted fields
filterMiddleware<UpdateBoardReqBody>(['title', 'description', 'type'])
```

### 2. Password Security

```typescript
// Salt + hash pattern
const hashPassword = (password: string): string => sha256(password + envConfig.passwordSecret)
```

### 3. CORS Configuration

```typescript
// Environment-based CORS
const corsOptions = {
  origin: envConfig.allowedOrigins?.split(','),
  credentials: true
}
```

## Performance Patterns

### 1. Parallel Processing

```typescript
// Use Promise.all for independent operations
const [access_token, refresh_token] = await Promise.all([signAccessToken(payload), signRefreshToken(payload)])
```

### 2. Database Optimization

```typescript
// Efficient updates with $currentDate
{
  $set: payload,
  $currentDate: { updated_at: true }
}
```

### 3. Connection Management

```typescript
// Single database connection instance
// Connection pooling through MongoDB driver
// Proper connection lifecycle management
```

## Testing Patterns

### 1. Layer Isolation

- Unit tests for individual services
- Integration tests for API endpoints
- Socket tests for real-time functionality

### 2. Mock Strategy

- Mock external services (Resend, UploadThing)
- In-memory database for testing
- Socket.IO client mocking

## Deployment Patterns

### 1. Environment Configuration

```typescript
// Environment-based configuration
export const envConfig = {
  port: process.env.PORT || 4000,
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET
}
```

### 2. Build Process

```
TypeScript Compilation → Path Resolution → Asset Copying → Production Bundle
```

This architecture ensures maintainability, scalability, and clear separation of concerns while following established Node.js and Express.js best practices.
