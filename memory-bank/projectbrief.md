# TrellOne API - Project Brief

## Project Overview

TrellOne is a modern, collaborative project management API inspired by Trello, built with Node.js, Express.js, TypeScript, and MongoDB. It provides a complete backend solution for board-based project management with real-time collaboration features.

## Core Requirements

### 1. User Management

- User registration and authentication with JWT
- Email verification system
- Password reset functionality
- OAuth integration (Google)
- User profile management with avatars

### 2. Board Management

- Create, read, update, delete boards
- Board ownership and member collaboration
- Board invitation system with email notifications
- Different board types (public/private)
- Board cover photos and customization

### 3. Column & Card System

- Columns within boards for workflow organization
- Cards within columns for tasks/items
- Drag-and-drop functionality (move cards between columns)
- Card details: title, description, due dates, attachments
- Card comments and activity tracking

### 4. Real-time Collaboration

- Socket.IO integration for live updates
- Real-time board changes across all connected users
- Live card movements and updates
- Instant notifications for invitations and changes

### 5. File Management

- Image upload and processing with Sharp
- Document attachments on cards
- Integration with UploadThing service
- Unsplash integration for cover photos

### 6. Communication

- Email service integration (Resend)
- Board invitation emails
- Verification and password reset emails
- Template-based email system

## Technical Goals

### Architecture

- Clean layered architecture: Routes → Middlewares → Controllers → Services → Database
- Type-safe development with TypeScript
- Comprehensive input validation
- Centralized error handling
- Security best practices

### Performance

- Efficient database queries with MongoDB aggregation
- Image optimization and processing
- Real-time performance with Socket.IO
- Proper indexing and data modeling

### Security

- JWT-based authentication with refresh tokens
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

1. Fully functional Trello-like API with all core features
2. Real-time collaboration without conflicts
3. Secure authentication and authorization
4. Scalable architecture for future enhancements
5. Comprehensive API documentation
6. Production-ready deployment configuration
