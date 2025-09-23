# 📖 Set Up MongoDB Atlas for Trellone API

Trellone API connects to MongoDB Atlas using credentials from environment variables. The connection URI is constructed in code from `DB_USERNAME`, `DB_PASSWORD` and a fixed cluster host.

## 1) Create a Cluster and Database User

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a new Project and Cluster (M0 for dev, M10+ for prod)
3. Database Access → Add New Database User
   - Username: set to your choice (e.g. `trellone`)
   - Password: generate a strong password
4. Note the database name you plan to use (e.g. `trellone`)

## 2) Network Access (Required for Render)

Atlas blocks connections unless allowed. Add IPs:

- Development: you can temporarily allow `0.0.0.0/0` (not recommended for prod)
- Staging/Production (Render): add the Render service outbound IPs (Render → your service → Settings)

## 3) Environment Variables

In `.env.{environment}` set:

```env
DB_NAME=trellone
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password

DB_WORKSPACES_COLLECTION=workspaces
DB_BOARDS_COLLECTION=boards
DB_COLUMNS_COLLECTION=columns
DB_CARDS_COLLECTION=cards
DB_USERS_COLLECTION=users
DB_REFRESH_TOKENS_COLLECTION=refresh_tokens
DB_INVITATIONS_COLLECTION=invitations
```

The code constructs the connection string like:

```
mongodb+srv://<DB_USERNAME>:<DB_PASSWORD>@trellone-cluster0.nnecc.mongodb.net/?retryWrites=true&w=majority&appName=<DB_NAME>
```

This means the Atlas cluster host is assumed to be `trellone-cluster0.nnecc.mongodb.net`. If your host differs, update the code or align your cluster host accordingly.

## 4) Verify Connection

- Start the API; on success you will see: `Pinged your deployment. You successfully connected to MongoDB!`
- If it fails, re-check credentials and Network Access allowlist.
