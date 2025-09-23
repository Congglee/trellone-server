TrellOne API — Project Brief
TrellOne API is a TypeScript Express backend for a Trello‑style collaboration app, delivering secure authentication, real‑time updates, and a maintainable layered architecture.

Key objectives

- Organize work via workspaces, boards, columns, and cards with predictable, validated APIs.
- Enable secure user lifecycle and team collaboration at scale.

Highlights

- JWT authentication with email verification and password reset (Resend).
- Real‑time board and card events via Socket.IO.
- Role‑based access and invitations for shared workspaces.
- CRUD with ordering and soft‑delete across core entities.
- File upload and media processing (Formidable, Sharp, UploadThing).
- Comprehensive validation and centralized error handling.

Tech stack
Node.js, TypeScript, Express.js, MongoDB, Socket.IO, express‑validator, JWT, Sharp, Formidable, UploadThing, Resend, Unsplash; ESLint, Prettier, Nodemon, tsx, tsc‑alias.

Significance
A scalable, type‑safe API with clear layers (routes → middlewares → controllers → services → database) enabling real‑time, collaborative product experiences.
