/**
 * Migration Script: Rename Board field from 'type' to 'visibility'
 *
 * This script renames the 'type' field to 'visibility' in the boards collection.
 *
 * Usage:
 *   - For local MongoDB: npx tsx scripts/migrations/rename-board-type-to-visibility.ts
 *   - For MongoDB Atlas: Update the connection string in the script and run
 *   - Or use npm script: npm run migrate:board-visibility
 *
 * IMPORTANT:
 *   - Backup your database before running this migration
 *   - Test this script in dev environment first
 *   - Run this script AFTER deploying the code changes that use 'visibility'
 *
 * Prerequisites:
 *   - MongoDB connection string configured
 *   - Database name and collection name from environment variables
 */

import { MongoClient, Collection } from 'mongodb'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables based on NODE_ENV
const env = process.env.NODE_ENV || 'development'
const envFilename = `.env.${env}`
config({ path: path.resolve(envFilename) })

const DB_URI = process.env.DB_URI
const DB_NAME = process.env.DB_NAME || 'trellone'
const DB_BOARDS_COLLECTION = process.env.DB_BOARDS_COLLECTION || 'boards'

interface MigrationResult {
  matchedCount: number
  modifiedCount: number
}

async function migrateBoardTypeToVisibility(): Promise<void> {
  if (!DB_URI) {
    throw new Error('DB_URI environment variable is not set')
  }

  const client = new MongoClient(DB_URI)

  try {
    console.log('Connecting to MongoDB...')
    await client.connect()
    console.log('Connected successfully')

    const db = client.db(DB_NAME)
    const boardsCollection: Collection = db.collection(DB_BOARDS_COLLECTION)

    // Check if any documents have the 'type' field
    const documentsWithType = await boardsCollection.countDocuments({ type: { $exists: true } })
    console.log(`Found ${documentsWithType} documents with 'type' field`)

    if (documentsWithType === 0) {
      console.log('No documents found with "type" field. Migration may have already been run.')
      return
    }

    // Rename the field from 'type' to 'visibility'
    console.log('Starting migration...')
    const result: MigrationResult = await boardsCollection.updateMany(
      { type: { $exists: true } },
      { $rename: { type: 'visibility' } }
    )

    console.log(`Migration completed successfully!`)
    console.log(`- Matched documents: ${result.matchedCount}`)
    console.log(`- Modified documents: ${result.modifiedCount}`)

    // Verify migration
    const documentsWithVisibility = await boardsCollection.countDocuments({ visibility: { $exists: true } })
    const documentsWithTypeAfter = await boardsCollection.countDocuments({ type: { $exists: true } })

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
  migrateBoardTypeToVisibility()
    .then(() => {
      console.log('\nMigration script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\nMigration script failed:', error)
      process.exit(1)
    })
}

export { migrateBoardTypeToVisibility }
