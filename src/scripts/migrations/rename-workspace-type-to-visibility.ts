/**
 * Migration Script: Rename Workspace field from 'type' to 'visibility'
 *
 * This script renames the 'type' field to 'visibility' in the workspaces collection.
 *
 * Usage:
 *   - For local MongoDB: npx tsx src/scripts/migrations/rename-workspace-type-to-visibility.ts
 *   - For MongoDB Atlas: Update the connection string in the script and run
 *   - Or use npm script: npm run migrate:workspace-visibility
 *
 * IMPORTANT:
 *   - Backup your database before running this migration
 *   - Test this script in dev environment first
 *   - Run this script AFTER deploying the code changes that use 'visibility'
 *
 * Prerequisites:
 *   - NODE_ENV environment variable set (development, staging, or production)
 *   - .env.{NODE_ENV} file exists with DB_URI, DB_NAME, and DB_WORKSPACES_COLLECTION configured
 *   - Environment variables are loaded via centralized config (src/config/environment.ts)
 */

import { MongoClient, Collection } from 'mongodb'
import { envConfig } from '~/config/environment'

// Use environment configuration from centralized config
const DB_URI = envConfig.dbUri
const DB_NAME = envConfig.dbName
const DB_WORKSPACES_COLLECTION = envConfig.dbWorkspacesCollection

interface MigrationResult {
  matchedCount: number
  modifiedCount: number
}

async function migrateWorkspaceTypeToVisibility(): Promise<void> {
  if (!DB_URI || !DB_NAME || !DB_WORKSPACES_COLLECTION) {
    throw new Error(
      'Required environment variables are not set. Please check DB_URI, DB_NAME, and DB_WORKSPACES_COLLECTION.'
    )
  }

  const client = new MongoClient(DB_URI)

  try {
    console.log('Connecting to MongoDB...')
    await client.connect()
    console.log('Connected successfully')

    const db = client.db(DB_NAME)
    const workspacesCollection: Collection = db.collection(DB_WORKSPACES_COLLECTION)

    // Check if any documents have the 'type' field
    const documentsWithType = await workspacesCollection.countDocuments({ type: { $exists: true } })
    console.log(`Found ${documentsWithType} documents with 'type' field`)

    if (documentsWithType === 0) {
      console.log('No documents found with "type" field. Migration may have already been run.')
      return
    }

    // Rename the field from 'type' to 'visibility'
    console.log('Starting migration...')
    const result: MigrationResult = await workspacesCollection.updateMany(
      { type: { $exists: true } },
      { $rename: { type: 'visibility' } }
    )

    console.log(`Migration completed successfully!`)
    console.log(`- Matched documents: ${result.matchedCount}`)
    console.log(`- Modified documents: ${result.modifiedCount}`)

    // Verify migration
    const documentsWithVisibility = await workspacesCollection.countDocuments({ visibility: { $exists: true } })
    const documentsWithTypeAfter = await workspacesCollection.countDocuments({ type: { $exists: true } })

    console.log('\nVerification:')
    console.log(`- Documents with 'visibility' field: ${documentsWithVisibility}`)
    console.log(`- Documents with 'type' field (should be 0): ${documentsWithTypeAfter}`)

    if (documentsWithTypeAfter > 0) {
      console.warn('\n⚠️  WARNING: Some documents still have the "type" field. Please investigate.')
    } else {
      console.log('\n✅ Migration verified successfully!')
    }
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await client.close()
    console.log('MongoDB connection closed')
  }
}

// Run migration
if (require.main === module) {
  migrateWorkspaceTypeToVisibility()
    .then(() => {
      console.log('\nMigration script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\nMigration script failed:', error)
      process.exit(1)
    })
}

export { migrateWorkspaceTypeToVisibility }
