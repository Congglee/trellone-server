# 📖 Set Up MongoDB Atlas for Trellone API

Trellone API connects to MongoDB Atlas using credentials from environment variables. Provide a full MongoDB connection string via `DB_URI` and set your database name via `DB_NAME`.

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
DB_URI=mongodb+srv://<username>:<password>@<your-cluster-host>/?retryWrites=true&w=majority&appName=<your-app-name>

DB_WORKSPACES_COLLECTION=workspaces
DB_BOARDS_COLLECTION=boards
DB_COLUMNS_COLLECTION=columns
DB_CARDS_COLLECTION=cards
DB_USERS_COLLECTION=users
DB_REFRESH_TOKENS_COLLECTION=refresh_tokens
DB_INVITATIONS_COLLECTION=invitations
```

Use a standard MongoDB Atlas connection string for `DB_URI`. You can copy the URI from Atlas (Connect → Drivers) and paste it into `DB_URI`.

## 4) Verify Connection

- Start the API; on success you will see: `Pinged your deployment. You successfully connected to MongoDB!`
- If it fails, re-check credentials and Network Access allowlist.
