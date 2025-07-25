# TrellOne API - Project Brief

## Project Overview

TrellOne is a modern, collaborative project management API inspired by Trello, built with Node.js, Express.js, TypeScript, and MongoDB. It provides a complete backend solution for hierarchical project management with real-time collaboration features, featuring a comprehensive workspace-based organizational structure.

## Core Requirements

### 1. Workspace Management System

**NEW CORE FEATURE**

- Hierarchical organization: Workspaces → Boards → Columns → Cards
- Full CRUD operations for workspace management
- Role-based workspace membership (Admin/Normal roles)
- Workspace types (Public/Private) with access control
- Guest user management within workspaces
- Workspace logo customization and branding
- Real-time workspace updates and collaboration
- Integration with board invitation system

### 2. User Management

- User registration and authentication with JWT
- Email verification system
- Password reset functionality
- OAuth integration (Google)
- User profile management with avatars
- **Enhanced**: Role-based access control across workspaces

### 3. Board Management

- Create, read, update, delete boards within workspaces
- Board ownership and member collaboration
- Board invitation system with email notifications
- Different board types (public/private)
- Board cover photos and customization
- **Enhanced**: Workspace-board relationship management

### 4. Column & Card System

- Columns within boards for workflow organization
- Cards within columns for tasks/items
- Drag-and-drop functionality (move cards between columns)
- Card details: title, description, due dates, attachments
- Card comments with emoji reactions
- Activity tracking and history

### 5. Real-time Collaboration

- Socket.IO integration for live updates
- Real-time workspace, board, column, and card changes
- Live updates across all connected users
- **Enhanced**: Workspace-level real-time collaboration
- Instant notifications for invitations and changes

### 6. File Management

- Image upload and processing with Sharp
- Document attachments on cards
- Integration with UploadThing service
- Unsplash integration for cover photos

### 7. Communication

- Email service integration (Resend)
- Board invitation emails
- **Enhanced**: Workspace invitation emails
- Verification and password reset emails
- Template-based email system

## Technical Goals

### Architecture

- **Enhanced**: Hierarchical layered architecture supporting workspace organization
- Clean separation: Routes → Middlewares → Controllers → Services → Database
- Type-safe development with TypeScript
- Comprehensive input validation
- Centralized error handling
- Security best practices with role-based access control

### Performance

- Efficient database queries with MongoDB aggregation
- **Enhanced**: Optimized workspace-board relationship queries
- Image optimization and processing
- Real-time performance with Socket.IO across all organizational levels
- Proper indexing and data modeling

### Security

- JWT-based authentication with refresh tokens
- **Enhanced**: Role-based authorization for workspaces and boards
- Password hashing with salt
- Input validation and sanitization
- CORS configuration
- File upload security

### Developer Experience

- Comprehensive TypeScript typing
- Consistent code patterns and conventions
- Detailed documentation and comments
- Error handling and logging
- Development tooling (ESLint, Prettier, Nodemon)

## Success Criteria

1. Fully functional Trello-like API with enhanced workspace functionality
2. **Enhanced**: Scalable hierarchical organization (Workspaces → Boards → Columns → Cards)
3. Real-time collaboration without conflicts across all organizational levels
4. Secure authentication and role-based authorization
5. Scalable architecture for future enhancements
6. Comprehensive API documentation
7. Production-ready deployment configuration

## Enhanced Business Value

### Organizational Scalability

- **Workspace-level organization** for enterprise and team management
- **Role-based access control** ensuring proper permissions
- **Hierarchical structure** supporting complex organizational needs
- **Real-time collaboration** across all organizational levels

### Enterprise Readiness

- Multi-team workspace management
- Scalable user and permission management
- Advanced organizational features
- Production-grade security and performance

The TrellOne API now provides a comprehensive, enterprise-ready solution that scales from individual use to large organizational deployments through its enhanced workspace management system.
