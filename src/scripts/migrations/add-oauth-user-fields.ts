/**
 * Migration Script: Add OAuth fields to existing users
 *
 * This script adds the following fields to existing users that don't have them:
 * - auth_providers: ['password'] (default for all existing users)
 * - is_password_login_enabled: true (default for all existing users)
 *
 * Strategy: Safe approach - all existing users are treated as password-enabled users.
 * When they login with Google later, the backend will automatically add 'google' to auth_providers.
 *
 * Usage:
 *   - For local MongoDB: npx tsx src/scripts/migrations/add-oauth-user-fields.ts
 *   - For MongoDB Atlas: Update the connection string in .env.{NODE_ENV} and run
 *   - Or use npm script: npm run migrate:oauth-fields
 *
 * IMPORTANT:
 *   - Backup your database before running this migration (use mongodump)
 *   - Test this script in dev/staging environment first
 *   - Run this script AFTER deploying the code changes that use these fields
 *
 * Prerequisites:
 *   - NODE_ENV environment variable set (development, staging, or production)
 *   - .env.{NODE_ENV} file exists with DB_URI, DB_NAME, and DB_USERS_COLLECTION configured
 *   - Environment variables are loaded via centralized config (src/config/environment.ts)
 */

import { MongoClient, Collection } from 'mongodb'
import { envConfig } from '~/config/environment'

const DB_URI = envConfig.dbUri
const DB_NAME = envConfig.dbName
const DB_USERS_COLLECTION = envConfig.dbUsersCollection

interface MigrationStats {
  beforeMigration: {
    totalUsers: number
    usersWithoutAuthProviders: number
    usersWithoutPasswordLoginEnabled: number
    usersWithAuthProviders: number
    usersWithPasswordLoginEnabled: number
  }
  afterMigration: {
    totalUsers: number
    usersWithoutAuthProviders: number
    usersWithoutPasswordLoginEnabled: number
    usersWithAuthProviders: number
    usersWithPasswordLoginEnabled: number
  }
  updateResults: {
    authProvidersUpdated: number
    passwordLoginEnabledUpdated: number
  }
}

async function addOAuthUserFields(): Promise<void> {
  if (!DB_URI || !DB_NAME || !DB_USERS_COLLECTION) {
    throw new Error(
      'Required environment variables are not set. Please check DB_URI, DB_NAME, and DB_USERS_COLLECTION.'
    )
  }

  const client = new MongoClient(DB_URI)
  const stats: MigrationStats = {
    beforeMigration: {
      totalUsers: 0,
      usersWithoutAuthProviders: 0,
      usersWithoutPasswordLoginEnabled: 0,
      usersWithAuthProviders: 0,
      usersWithPasswordLoginEnabled: 0
    },
    afterMigration: {
      totalUsers: 0,
      usersWithoutAuthProviders: 0,
      usersWithoutPasswordLoginEnabled: 0,
      usersWithAuthProviders: 0,
      usersWithPasswordLoginEnabled: 0
    },
    updateResults: {
      authProvidersUpdated: 0,
      passwordLoginEnabledUpdated: 0
    }
  }

  try {
    console.log('='.repeat(60))
    console.log('OAuth User Fields Migration Script')
    console.log('='.repeat(60))
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`Database: ${DB_NAME}`)
    console.log(`Collection: ${DB_USERS_COLLECTION}`)
    console.log('='.repeat(60))
    console.log()

    console.log('Connecting to MongoDB...')
    await client.connect()
    console.log('✅ Connected successfully\n')

    const db = client.db(DB_NAME)
    const usersCollection: Collection = db.collection(DB_USERS_COLLECTION)

    // Step 1: Dry-run statistics before migration
    console.log('📊 Step 1: Analyzing current data (dry-run)...')
    stats.beforeMigration.totalUsers = await usersCollection.countDocuments({})
    stats.beforeMigration.usersWithoutAuthProviders = await usersCollection.countDocuments({
      auth_providers: { $exists: false }
    })
    stats.beforeMigration.usersWithoutPasswordLoginEnabled = await usersCollection.countDocuments({
      is_password_login_enabled: { $exists: false }
    })
    stats.beforeMigration.usersWithAuthProviders = await usersCollection.countDocuments({
      auth_providers: { $exists: true }
    })
    stats.beforeMigration.usersWithPasswordLoginEnabled = await usersCollection.countDocuments({
      is_password_login_enabled: { $exists: true }
    })

    console.log('Current state:')
    console.log(`  - Total users: ${stats.beforeMigration.totalUsers}`)
    console.log(`  - Users WITHOUT auth_providers: ${stats.beforeMigration.usersWithoutAuthProviders}`)
    console.log(`  - Users WITH auth_providers: ${stats.beforeMigration.usersWithAuthProviders}`)
    console.log(
      `  - Users WITHOUT is_password_login_enabled: ${stats.beforeMigration.usersWithoutPasswordLoginEnabled}`
    )
    console.log(`  - Users WITH is_password_login_enabled: ${stats.beforeMigration.usersWithPasswordLoginEnabled}`)
    console.log()

    if (
      stats.beforeMigration.usersWithoutAuthProviders === 0 &&
      stats.beforeMigration.usersWithoutPasswordLoginEnabled === 0
    ) {
      console.log('✅ No users need migration. All users already have the required fields.')
      console.log('Migration may have already been run, or all users were created after the refactor.')
      return
    }

    // Step 2: Perform migration
    console.log('🔄 Step 2: Starting migration...')
    console.log()

    // Update auth_providers
    if (stats.beforeMigration.usersWithoutAuthProviders > 0) {
      console.log(`Updating auth_providers for ${stats.beforeMigration.usersWithoutAuthProviders} users...`)
      const authProvidersResult = await usersCollection.updateMany(
        { auth_providers: { $exists: false } },
        { $set: { auth_providers: ['password'] } }
      )
      stats.updateResults.authProvidersUpdated = authProvidersResult.modifiedCount
      console.log(`  ✅ Updated ${authProvidersResult.modifiedCount} users`)
      console.log(`  📝 Matched ${authProvidersResult.matchedCount} users`)
    } else {
      console.log('  ⏭️  No users need auth_providers update')
    }

    // Update is_password_login_enabled
    if (stats.beforeMigration.usersWithoutPasswordLoginEnabled > 0) {
      console.log(
        `Updating is_password_login_enabled for ${stats.beforeMigration.usersWithoutPasswordLoginEnabled} users...`
      )
      const passwordLoginEnabledResult = await usersCollection.updateMany(
        { is_password_login_enabled: { $exists: false } },
        { $set: { is_password_login_enabled: true } }
      )
      stats.updateResults.passwordLoginEnabledUpdated = passwordLoginEnabledResult.modifiedCount
      console.log(`  ✅ Updated ${passwordLoginEnabledResult.modifiedCount} users`)
      console.log(`  📝 Matched ${passwordLoginEnabledResult.matchedCount} users`)
    } else {
      console.log('  ⏭️  No users need is_password_login_enabled update')
    }

    console.log()

    // Step 3: Verify migration
    console.log('🔍 Step 3: Verifying migration results...')
    stats.afterMigration.totalUsers = await usersCollection.countDocuments({})
    stats.afterMigration.usersWithoutAuthProviders = await usersCollection.countDocuments({
      auth_providers: { $exists: false }
    })
    stats.afterMigration.usersWithoutPasswordLoginEnabled = await usersCollection.countDocuments({
      is_password_login_enabled: { $exists: false }
    })
    stats.afterMigration.usersWithAuthProviders = await usersCollection.countDocuments({
      auth_providers: { $exists: true }
    })
    stats.afterMigration.usersWithPasswordLoginEnabled = await usersCollection.countDocuments({
      is_password_login_enabled: { $exists: true }
    })

    console.log('After migration:')
    console.log(`  - Total users: ${stats.afterMigration.totalUsers}`)
    console.log(`  - Users WITHOUT auth_providers: ${stats.afterMigration.usersWithoutAuthProviders} (should be 0)`)
    console.log(`  - Users WITH auth_providers: ${stats.afterMigration.usersWithAuthProviders}`)
    console.log(
      `  - Users WITHOUT is_password_login_enabled: ${stats.afterMigration.usersWithoutPasswordLoginEnabled} (should be 0)`
    )
    console.log(`  - Users WITH is_password_login_enabled: ${stats.afterMigration.usersWithPasswordLoginEnabled}`)
    console.log()

    // Step 4: Sample verification
    console.log('📋 Step 4: Sampling updated documents...')
    const sampleUsers = await usersCollection
      .find({ auth_providers: { $exists: true }, is_password_login_enabled: { $exists: true } })
      .limit(3)
      .toArray()

    if (sampleUsers.length > 0) {
      console.log(`Sample of ${sampleUsers.length} updated users:`)
      sampleUsers.forEach((user, index) => {
        console.log(`  User ${index + 1}:`)
        console.log(`    - Email: ${user.email}`)
        console.log(`    - auth_providers: ${JSON.stringify(user.auth_providers)}`)
        console.log(`    - is_password_login_enabled: ${user.is_password_login_enabled}`)
      })
    }
    console.log()

    // Step 5: Final verification
    const hasErrors =
      stats.afterMigration.usersWithoutAuthProviders > 0 || stats.afterMigration.usersWithoutPasswordLoginEnabled > 0

    if (hasErrors) {
      console.warn('⚠️  WARNING: Some users still missing required fields!')
      console.warn('Please investigate the following:')
      if (stats.afterMigration.usersWithoutAuthProviders > 0) {
        console.warn(`  - ${stats.afterMigration.usersWithoutAuthProviders} users still missing auth_providers`)
      }
      if (stats.afterMigration.usersWithoutPasswordLoginEnabled > 0) {
        console.warn(
          `  - ${stats.afterMigration.usersWithoutPasswordLoginEnabled} users still missing is_password_login_enabled`
        )
      }
    } else {
      console.log('✅ Migration verified successfully!')
      console.log('All users now have auth_providers and is_password_login_enabled fields.')
    }

    console.log()
    console.log('='.repeat(60))
    console.log('Migration Summary')
    console.log('='.repeat(60))
    console.log(`Users updated with auth_providers: ${stats.updateResults.authProvidersUpdated}`)
    console.log(`Users updated with is_password_login_enabled: ${stats.updateResults.passwordLoginEnabledUpdated}`)
    console.log(`Total users in database: ${stats.afterMigration.totalUsers}`)
    console.log('='.repeat(60))
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await client.close()
    console.log('\n✅ MongoDB connection closed')
  }
}

// Run migration
if (require.main === module) {
  addOAuthUserFields()
    .then(() => {
      console.log('\n✅ Migration script completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error)
      process.exit(1)
    })
}

export { addOAuthUserFields }
