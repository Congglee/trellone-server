# TrellOne API - Architecture

## System Architecture

### Layered Architecture Pattern

TrellOne follows a strict layered architecture with clear separation of concerns:

```
Routes → Middlewares → Controllers → Services → Database
```

Each layer has specific responsibilities and dependencies flow downward only.

## Source Code Paths

### Directory Structure

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
```

### Layer Responsibilities

#### 1. Routes Layer (`src/routes/`)

- **Files**: `*.routes.ts` (e.g., `workspaces.routes.ts`, `boards.routes.ts`, `users.routes.ts`)
- **Purpose**: Define API endpoints and middleware chains
- **Pattern**: HTTP method routing with middleware orchestration

#### 2. Middlewares Layer (`src/middlewares/`)

- **Files**: `*.middlewares.ts` (e.g., `auth.middlewares.ts`, `workspaces.middlewares.ts`, `boards.middlewares.ts`)
- **Purpose**: Request preprocessing, validation, and authentication
- **Pattern**: Validation chains using express-validator

#### 3. Controllers Layer (`src/controllers/`)

- **Files**: `*.controllers.ts` (e.g., `workspaces.controllers.ts`, `boards.controllers.ts`, `users.controllers.ts`)
- **Purpose**: Request handling and business logic coordination
- **Pattern**: Extract → Service Call → Response formatting

#### 4. Services Layer (`src/services/`)

- **Files**: `*.services.ts` (e.g., `workspaces.services.ts`, `boards.services.ts`, `auth.services.ts`)
- **Purpose**: Business logic implementation and data access
- **Pattern**: Class-based services with singleton instances

#### 5. Database Layer (`src/services/database.services.ts`)

- **Purpose**: Database connection and collection management
- **Pattern**: Centralized database access with collection getters

## Key Technical Decisions

### 1. Database Schema Pattern

- **Dual Interface + Class Pattern**: Every schema has both TypeScript interface and class
- **Default Value Management**: Classes handle default values consistently
- **Soft Deletes**: `_destroy` flag instead of hard deletes

### 2. Authentication Strategy

- **JWT Tokens**: Access (15m) + Refresh (7d) tokens
- **Cookie + Header**: Priority-based token extraction
- **Socket Authentication**: Cookie-based for real-time connections

### 3. Real-time Architecture

- **Socket.IO**: Room-based communication for board isolation
- **Event Handlers**: Feature-specific socket handlers
- **Authentication Middleware**: Token verification for all socket events

### 4. Hierarchical Organization

- **Workspace Management**: Enterprise-grade organizational structure
- **Role-based Access**: Admin/Normal roles across workspaces and boards
- **Data Hierarchy**: Workspaces → Boards → Columns → Cards

### 5. Role-Based Access Control (RBAC)

- **Granular Permissions**: Fine-grained permissions for workspaces and boards
- **Permission Inheritance**: Board roles can inherit from workspace roles
- **Explicit Overrides**: Board-level roles can override workspace-level roles
- **Middleware Integration**: RBAC checks integrated into route middleware chains

## Design Patterns

### 1. Service Layer Pattern

```typescript
class ServiceName {
  private signAccessToken() {} // Private utilities
  async createResource() {} // Public business logic
}
const serviceName = new ServiceName()
export default serviceName
```

### 2. Repository Pattern (via Database Service)

```typescript
class DatabaseService {
  get users(): Collection<User> {}
  get workspaces(): Collection<Workspace> {}
  get boards(): Collection<Board> {}
}
```

### 3. Factory Pattern (Schema Creation)

```typescript
interface UserSchema {
  email: string
  password: string
}
export default class User {
  constructor(user: UserSchema) {
    this.email = user.email
    this.created_at = new Date()
  }
}
```

### 4. Middleware Chain Pattern

```typescript
router.put(
  '/:id',
  accessTokenValidator, // Authentication
  resourceIdValidator, // Resource validation
  updateValidator, // Input validation
  filterMiddleware(['field1']), // Body filtering
  wrapRequestHandler(controller) // Controller
)
```

### 5. RBAC Middleware Pattern

```typescript
router.put(
  '/:workspace_id',
  accessTokenValidator,
  verifiedUserValidator,
  workspaceIdValidator,
  updateWorkspaceValidator,
  filterMiddleware<UpdateWorkspaceReqBody>(['title', 'description', 'type', 'logo']),
  requireWorkspacePermission(WorkspacePermission.ManageWorkspace), // RBAC check
  wrapRequestHandler(updateWorkspaceController)
)
```

## Component Relationships

### 1. Authentication Flow

```
Request → Extract Token → Verify JWT → Attach User → Proceed
```

### 2. Database Operations

```
Controller → Service → Database Service → MongoDB Collection
```

### 3. Real-time Communication

```
Client Event → Socket Handler → Service → Database → Broadcast
```

### 4. File Upload Pipeline

```
Upload → Temp Storage → Sharp Processing → UploadThing → Cleanup
```

### 5. Hierarchical Data Flow

```
Workspace Operation → Board Impact → Column Impact → Card Impact
```

### 6. RBAC Permission Flow

```
Request → Authentication → Resource Validation → RBAC Check → Controller
```

## Critical Implementation Paths

### 1. User Registration Flow

```
POST /auth/register → registerValidator → registerController →
authService.register() → User.schema → database.users.insertOne() →
sendVerifyEmail() → JWT generation → Cookie setting →
Auto-create workspace
```

### 2. Workspace Creation Flow

```
POST /workspaces → accessTokenValidator → verifiedUserValidator →
createWorkspaceValidator → createWorkspaceController →
workspacesService.createWorkspace() → Workspace.schema →
database.workspaces.insertOne() → Response
```

### 3. Board Creation Flow

```
POST /boards → accessTokenValidator → verifiedUserValidator →
createBoardValidator → createBoardController →
boardsService.createBoard() → Board.schema →
database.boards.insertOne() → Update workspace → Response
```

### 4. Card Management Flow

```
POST /cards → accessTokenValidator → verifiedUserValidator →
cardIdValidator → createCardValidator → createCardController →
cardsService.createCard() → Card.schema →
database.cards.insertOne() → Update column → Socket broadcast
```

### 5. Card Deletion Flow

```
DELETE /cards/:card_id → accessTokenValidator → verifiedUserValidator →
cardIdValidator → deleteCardController →
cardsService.deleteCard() → Remove from database →
Update column card_order_ids → Socket broadcast
```

### 6. Board Collaboration Flow

```
Socket Connection → Authentication → Room Join →
Board Update Event → boardsService.updateBoard() →
Database Update → Broadcast to Room
```

### 7. Card Movement Flow

```
PUT /cards/supports/moving-card → Authentication → Validation →
cardsService.moveCardToDifferentColumn() → Multi-collection Updates →
Socket Broadcast → Real-time UI Updates
```

### 8. File Upload Flow

```
POST /medias/upload-image → Authentication → File Validation →
Temporary Storage → Sharp Processing → UploadThing Upload →
Database Storage → Cleanup → Response
```

### 9. Workspace Member Management Flow

```
Workspace Access → workspaceIdValidator → MongoDB Aggregation →
Member lookup → User details join → Permission validation →
Attach to request → Controller access
```

### 10. Comment Reaction Flow

```
PUT /cards/:card_id → Authentication → Validation →
cardsService.reactCardComment() → MongoDB positional update →
Reaction management → Socket broadcast → Real-time updates
```

### 11. RBAC Permission Check Flow

```
Route Access → Authentication → Resource Validation →
RBAC Middleware → Permission Check → Controller
```

### 12. Invitation Flow

```
POST /invitations/workspace → Authentication → Validation →
Invitation Creation → Email Sending → Database Storage
```

## Error Handling Architecture

### 1. Centralized Error Handler

```typescript
export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ErrorWithStatus) {
    return res.status(err.status).json(omit(err, ['status']))
  }
  // Handle other errors...
}
```

### 2. Custom Error Classes

```typescript
export class ErrorWithStatus extends Error {
  status: number
  constructor({ message, status }: { message: string; status: number }) {
    super(message)
    this.status = status
  }
}
```

## Performance Optimization

### 1. Database Patterns

- **Aggregation Pipelines**: Complex queries with MongoDB aggregation
- **Parallel Operations**: Promise.all for independent operations
- **Connection Pooling**: Single connection instance with driver pooling

### 2. Real-time Optimization

- **Room-based Communication**: Targeted message broadcasting
- **Event Batching**: Efficient socket event handling
- **Connection Management**: Proper cleanup and session tracking

## Security Architecture

### 1. Input Validation

- **express-validator**: Schema-based validation for all endpoints
- **Custom Validators**: Business logic validation in middleware
- **File Upload Security**: MIME type and size validation

### 2. Authentication Security

- **JWT Signing**: Separate secrets for different token types
- **Password Hashing**: Salt + SHA256 for password security
- **CORS Configuration**: Environment-based origin control

### 3. Role-based Access Control

- **Workspace Roles**: Admin/Normal permissions within workspaces
- **Board Access**: Workspace membership determines board access
- **Resource Authorization**: Middleware validates user permissions
- **Granular Permissions**: Fine-grained control over actions

### 4. RBAC Security

- **Permission-based Access**: Actions require specific permissions
- **Inheritance Model**: Roles inherit permissions from parent roles
- **Explicit Overrides**: Fine-grained control at resource level

## External Service Integration

### 1. Provider Pattern

- **Resend**: Email service integration
- **UploadThing**: File upload service
- **Unsplash**: Image service for cover photos

### 2. Service Abstraction

```typescript
export const sendVerifyRegisterEmail = async (email: string, token: string) => {
  // Abstract external service complexity
}
```

This architecture ensures maintainability, scalability, and clear separation of concerns while following established Node.js and Express.js best practices. The enhanced workspace management system provides enterprise-grade organizational capabilities while maintaining architectural consistency. The RBAC system adds fine-grained access control for secure collaboration.
