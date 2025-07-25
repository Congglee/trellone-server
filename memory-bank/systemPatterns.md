# TrellOne API - System Patterns

## Architecture Overview

### Layered Architecture Pattern

TrellOne follows a strict layered architecture with clear separation of concerns and hierarchical data organization:

```
Routes → Middlewares → Controllers → Services → Database
```

Each layer has specific responsibilities and dependencies flow downward only.

### Enhanced Hierarchical Data Architecture

**Organizational Structure**:

```
Workspaces (NEW)
└── Boards
    └── Columns
        └── Cards
            ├── Comments
            │   └── Reactions
            └── Attachments
```

### Layer Responsibilities

#### 1. Routes Layer (`src/routes/`)

- **Purpose**: Define API endpoints and middleware chains
- **Files**: `*.routes.ts` (e.g., `workspaces.routes.ts`, `boards.routes.ts`, `users.routes.ts`)
- **Responsibilities**:
  - HTTP method routing (GET, POST, PUT, DELETE)
  - Middleware chain orchestration
  - Request handler wrapping with `wrapRequestHandler`

#### 2. Middlewares Layer (`src/middlewares/`)

- **Purpose**: Request preprocessing, validation, and authentication
- **Files**: `*.middlewares.ts` (e.g., `auth.middlewares.ts`, `workspaces.middlewares.ts`, `boards.middlewares.ts`)
- **Responsibilities**:
  - Authentication and authorization
  - **Enhanced**: Role-based access control for workspaces and boards
  - Input validation using express-validator
  - Request body filtering
  - Custom business logic validation

#### 3. Controllers Layer (`src/controllers/`)

- **Purpose**: Request handling and business logic coordination
- **Files**: `*.controllers.ts` (e.g., `workspaces.controllers.ts`, `boards.controllers.ts`, `users.controllers.ts`)
- **Responsibilities**:
  - Extract data from requests
  - Coordinate service layer calls
  - Format and return responses
  - Cookie management for authentication

#### 4. Services Layer (`src/services/`)

- **Purpose**: Business logic implementation and data access
- **Files**: `*.services.ts` (e.g., `workspaces.services.ts`, `boards.services.ts`, `auth.services.ts`)
- **Responsibilities**:
  - Business logic implementation
  - **Enhanced**: Workspace-board relationship management
  - Database operations
  - External service integrations
  - Transaction management

#### 5. Database Layer (`src/services/database.services.ts`)

- **Purpose**: Database connection and collection management
- **Responsibilities**:
  - MongoDB connection management
  - **Enhanced**: Workspace collection management
  - Collection access patterns
  - Database configuration

## Design Patterns

### 1. Service Layer Pattern

Each business domain has a dedicated service class, including the new workspace domain:

```typescript
class WorkspacesService {
  async createWorkspace(user_id: string, data: CreateWorkspaceReqBody) {}
  async getWorkspaces(params: GetWorkspacesParams) {}
  async updateWorkspace(id: string, data: UpdateWorkspaceReqBody) {}
}

class BoardsService {
  async createBoard(user_id: string, data: CreateBoardReqBody) {}
  // Enhanced with workspace integration
  async getBoardsByWorkspace(workspace_id: string) {}
}

const workspacesService = new WorkspacesService()
const boardsService = new BoardsService()
export default workspacesService
```

### 2. Repository Pattern (via Database Service)

Centralized database access through a single service with workspace support:

```typescript
class DatabaseService {
  get users(): Collection<User> {}
  get workspaces(): Collection<Workspace> {} // NEW
  get boards(): Collection<Board> {}
  get cards(): Collection<Card> {}
}
```

### 3. Factory Pattern (Schema Creation)

Consistent object creation using schema classes, including workspace schema:

```typescript
// Interface for input validation
interface WorkspaceSchema {
  title: string
  description?: string
  type: WorkspaceType
  members: WorkspaceMember[]
}

// Class for object creation with defaults
export default class Workspace {
  constructor(workspace: WorkspaceSchema) {
    this.title = workspace.title
    this.description = workspace.description || ''
    this.type = workspace.type || WorkspaceType.Private
    this.members = workspace.members || []
    this.created_at = new Date()
  }
}
```

### 4. Middleware Chain Pattern

Consistent middleware ordering across all routes, including workspace routes:

```typescript
router.put(
  '/:workspace_id',
  accessTokenValidator, // Authentication
  workspaceIdValidator, // Resource validation
  updateWorkspaceValidator, // Input validation
  filterMiddleware(['title', 'description', 'type']), // Body filtering
  wrapRequestHandler(updateWorkspaceController) // Controller
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

**Enhanced with workspace support**:

```
Client Action → Socket Event → Service → Database → Broadcast to Workspace/Board Rooms
```

### 4. Hierarchical Data Flow

**NEW - Workspace Integration**:

```
Workspace Operation → Board Impact → Column Impact → Card Impact
```

## Authentication Architecture

### 1. JWT Token Strategy

- **Access Tokens**: Short-lived (1 hour) for API access
- **Refresh Tokens**: Long-lived (100 days) for token renewal
- **Special Tokens**: Email verification, password reset, board invitations, workspace invitations

### 2. Token Storage Patterns

```typescript
// Dual storage: Cookies + Headers
// Priority 1: HTTP-only cookies (preferred)
// Priority 2: Authorization header (fallback)
```

### 3. Authorization Flow

**Enhanced with role-based access**:

```
Request → Extract Token (Cookie/Header) → Verify Token → Check Workspace/Board Permissions → Attach User Data → Proceed
```

## Database Patterns

### 1. Schema Definition Pattern

Every collection follows the dual interface + class pattern, including workspaces:

- **Interface**: Input validation and optional fields
- **Class**: Object creation with defaults and required fields

### 2. ObjectId Conversion Pattern

```typescript
// Always convert string IDs to ObjectId for database operations
const user_id = new ObjectId(user_id_string)
const workspace_id = new ObjectId(body.workspace_id) // NEW
const board_id = new ObjectId(body.board_id)
```

### 3. Aggregation Pipeline Pattern

Complex queries use MongoDB aggregation with workspace support:

```typescript
const pipeline = [
  { $match: { workspace_id: new ObjectId(workspace_id) } }, // NEW
  { $match: { user_id: new ObjectId(user_id) } },
  { $lookup: { from: 'users', localField: 'user_id', foreignField: '_id', as: 'user' } },
  { $unwind: '$user' },
  { $sort: { created_at: -1 } }
]
```

### 4. Hard Delete with Reference Cleanup Pattern

**Enhanced for hierarchical cleanup**:

```typescript
// Delete entity and clean up references across hierarchy
await databaseService.cards.deleteOne({ _id: new ObjectId(card_id) })
await databaseService.columns.findOneAndUpdate(
  { _id: new ObjectId(column_id) },
  { $pull: { card_order_ids: new ObjectId(card_id) } }
)
```

### 5. Soft Delete Pattern

```typescript
// Mark as deleted instead of removing
{ $set: { _destroy: true }, $currentDate: { updated_at: true } }
```

## Real-time Architecture

### 1. Socket.IO Integration

```typescript
// Server-side socket management with workspace support
const io = new Server(httpServer, { cors: corsOptions })

// Authentication middleware for sockets
io.use(async (socket, next) => {
  // Cookie-based authentication
  const access_token = extractTokenFromCookies(socket.handshake.headers.cookie)
  // Verify and attach user data with workspace permissions
})
```

### 2. Room-based Communication

**Enhanced with workspace rooms**:

```typescript
// Users join workspace and board-specific rooms
socket.join(`workspace:${workspaceId}`) // NEW
socket.join(`board:${boardId}`)

// Broadcast to specific workspace or board
io.to(`workspace:${workspaceId}`).emit('workspaceUpdate', data) // NEW
io.to(`board:${boardId}`).emit('boardUpdate', data)
```

### 3. Event Handling Pattern

**Enhanced with workspace events**:

```typescript
// Feature-specific socket handlers
socket.on('updateWorkspace', async (data) => {
  // Validate data
  // Update database
  // Broadcast to workspace room
})

socket.on('updateBoard', async (data) => {
  // Validate data
  // Update database
  // Broadcast to board and workspace rooms
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

export const sendWorkspaceInvitationEmail = async (data: WorkspaceInvitationData) => {
  // NEW - Handle workspace invitation emails
}
```

## Validation Patterns

### 1. Express-Validator Integration

**Enhanced with workspace validation**:

```typescript
// Schema-based validation
export const createWorkspaceValidator = validate(
  checkSchema(
    {
      title: { notEmpty: true, isString: true, trim: true },
      description: { optional: true, isString: true },
      type: { isIn: { options: [['Public', 'Private']] } }
    },
    ['body']
  )
)
```

### 2. Custom Validation Pattern

**Enhanced with workspace authorization**:

```typescript
// Business logic validation in schemas
custom: {
  options: async (value, { req }) => {
    // Workspace access checks
    // Role-based validation
    // Attach data to request
    return true
  }
}
```

## Security Patterns

### 1. Input Sanitization

```typescript
// Filter middleware removes unwanted fields
filterMiddleware<UpdateWorkspaceReqBody>(['title', 'description', 'type']) // NEW
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

**Enhanced with workspace query optimization**:

```typescript
// Efficient updates with $currentDate
{
  $set: payload,
  $currentDate: { updated_at: true }
}

// Optimized workspace-board relationship queries
const pipeline = [
  { $match: { workspace_id: new ObjectId(workspace_id) } },
  { $lookup: { from: 'boards', localField: '_id', foreignField: 'workspace_id', as: 'boards' } }
]
```

### 3. Connection Management

```typescript
// Single database connection instance
// Connection pooling through MongoDB driver
// Proper connection lifecycle management
```

## Testing Patterns

### 1. Layer Isolation

- Unit tests for individual services including workspace services
- Integration tests for API endpoints including workspace endpoints
- Socket tests for real-time functionality across all organizational levels

### 2. Mock Strategy

- Mock external services (Resend, UploadThing)
- In-memory database for testing
- Socket.IO client mocking with workspace room testing

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

This architecture ensures maintainability, scalability, and clear separation of concerns while following established Node.js and Express.js best practices. The enhanced workspace functionality provides enterprise-grade organizational capabilities while maintaining the clean architectural patterns.

## Development Rules & Documentation

### Comprehensive Pattern Documentation

The project maintains detailed development patterns and best practices in `.augment/rules/imported/`:

- **Controller Layer Patterns**: Request handling, data extraction, response formatting
- **Middleware Best Practices**: Validation chains, authentication, error handling
- **MongoDB Schema Patterns**: Database design, schema definitions, data modeling
- **Service Layer Patterns**: Business logic implementation, database operations
- **Route Layer Patterns**: API endpoint organization, middleware orchestration
- **Utility Functions**: Helper functions, common operations, reusable components

### Pattern Enforcement

These documented patterns ensure:

- **Consistency**: All developers follow the same conventions across all features
- **Maintainability**: Code is predictable and easy to modify
- **Scalability**: Architecture supports growth and new features including workspace enhancements
- **Quality**: Best practices are embedded in development workflow
- **Onboarding**: New team members can quickly understand the codebase including hierarchical structure
