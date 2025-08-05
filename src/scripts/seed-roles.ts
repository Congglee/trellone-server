import { RoleLevel, WorkspaceRole } from '~/constants/enums'
import logger from '~/config/logger'
import Role from '~/models/schemas/Role.schema'
import databaseService from '~/services/database.services'

const WORKSPACE_ADMIN_PERMISSIONS = [
  // === Workspace Management ===
  'workspace:read', // View workspace details
  'workspace:update', // Edit workspace (title, description, type, logo)
  'workspace:delete', // Delete entire workspace
  'workspace:manage_settings', // Change workspace type (Public/Private)

  // === Member Management ===
  'workspace:manage_members', // Add/remove workspace members
  'workspace:manage_roles', // Change member roles
  'workspace:view_members', // View all workspace members
  'workspace:manage_guests', // Add/remove guest users

  // === Board Operations (Workspace-Scoped) ===
  'board:create', // Create new boards in workspace
  'board:read', // View boards (scope determined by middleware)
  'board:update', // Edit boards (scope determined by middleware)
  'board:read_all', // View all workspace boards
  'board:update_all', // Edit any board in workspace
  'board:delete_all', // Delete any board in workspace
  'board:manage_members_all', // Manage members on any board

  // === Invitation Management ===
  'invitation:create', // Send board invitations
  'invitation:manage', // Accept/reject/cancel invitations
  'invitation:view_all', // View all workspace invitations

  // === Advanced Operations ===
  'workspace:view_analytics', // Access workspace analytics/stats
  'workspace:export_data', // Export workspace data
  'workspace:manage_integrations' // Manage external integrations
]

const WORKSPACE_NORMAL_PERMISSIONS = [
  // === Basic Workspace Access ===
  'workspace:read', // View workspace details
  'workspace:view_members', // View workspace members (read-only)

  // === Board Operations (Limited) ===
  'board:create', // Create new boards in workspace
  'board:read', // View boards (scope determined by middleware)
  'board:update', // Edit boards (scope determined by middleware)
  'board:read_assigned', // View boards they're members of
  'board:update_assigned', // Edit boards they're members of
  'board:manage_own_membership', // Leave boards they're on

  // === Collaboration Features ===
  'invitation:create', // Send board invitations (limited scope)
  'invitation:view_own', // View their own invitations
  'invitation:respond', // Accept/reject invitations sent to them

  // === Content Management ===
  'column:create', // Create columns in accessible boards
  'column:update', // Edit columns in accessible boards
  'card:create', // Create cards
  'card:update', // Edit cards
  'card:comment', // Comment on cards
  'card:attach_files' // Add attachments to cards
]

interface RoleDefinition {
  name: string
  level: RoleLevel
  permissions: string[]
}

const WORKSPACE_ROLES: RoleDefinition[] = [
  {
    name: WorkspaceRole.Admin,
    level: RoleLevel.Workspace,
    permissions: WORKSPACE_ADMIN_PERMISSIONS
  },
  {
    name: WorkspaceRole.Normal,
    level: RoleLevel.Workspace,
    permissions: WORKSPACE_NORMAL_PERMISSIONS
  }
]

/**
 * Check if a role already exists in the database
 */
async function roleExists(name: string, level: RoleLevel): Promise<boolean> {
  try {
    const existingRole = await databaseService.roles.findOne({
      name,
      level
    })
    return existingRole !== null
  } catch (error) {
    logger.error(`Error checking if role exists: ${error}`)
    throw error
  }
}

/**
 * Create a new role in the database
 */
async function createRole(roleDefinition: RoleDefinition): Promise<void> {
  try {
    const newRole = new Role({
      name: roleDefinition.name,
      level: roleDefinition.level,
      permissions: roleDefinition.permissions
    })

    const result = await databaseService.roles.insertOne(newRole)

    if (result.insertedId) {
      logger.success(`✅ Created role: ${roleDefinition.name} (${roleDefinition.level})`)
      logger.info(`   - Permissions: ${roleDefinition.permissions.length} permissions`)
    } else {
      throw new Error(`Failed to insert role: ${roleDefinition.name}`)
    }
  } catch (error) {
    logger.error(`❌ Error creating role ${roleDefinition.name}: ${error}`)
    throw error
  }
}

/**
 * Seed all workspace roles
 */
async function seedWorkspaceRoles(): Promise<void> {
  logger.info('🌱 Starting workspace roles seeding...')
  logger.info(`📋 Roles to seed: ${WORKSPACE_ROLES.length}`)

  let createdCount = 0
  let skippedCount = 0

  for (const roleDefinition of WORKSPACE_ROLES) {
    try {
      const exists = await roleExists(roleDefinition.name, roleDefinition.level)

      if (exists) {
        logger.info(`⏭️  Skipped: ${roleDefinition.name} (already exists)`)
        skippedCount++
      } else {
        await createRole(roleDefinition)
        createdCount++
      }
    } catch (error) {
      logger.error(`❌ Failed to process role ${roleDefinition.name}: ${error}`)
      throw error
    }
  }

  logger.success(`🎉 Workspace roles seeding completed!`)
  logger.info(`📊 Summary:`)
  logger.info(`   - Created: ${createdCount} roles`)
  logger.info(`   - Skipped: ${skippedCount} roles (already existed)`)
  logger.info(`   - Total: ${createdCount + skippedCount} roles processed`)
}

/**
 * Main function to execute the seeding process
 */
async function main() {
  try {
    logger.info('🚀 TrellOne API - Role Seeding Script')
    logger.info('=====================================')

    // Connect to database
    logger.info('🔌 Connecting to database...')
    await databaseService.connect()
    logger.success('✅ Database connected successfully')

    // Seed workspace roles
    await seedWorkspaceRoles()

    logger.info('=====================================')
    logger.success('🎯 Role seeding script completed successfully!')
  } catch (error) {
    logger.error('❌ Role seeding script failed:')
    logger.error(error instanceof Error ? error.message : String(error))

    if (error instanceof Error && error.stack) {
      logger.error('Stack trace:')
      logger.error(error.stack)
    }

    process.exit(1)
  } finally {
    // Always disconnect from database
    try {
      await databaseService.disconnect()
      logger.info('🔌 Database disconnected')
    } catch (disconnectError) {
      logger.error('❌ Error disconnecting from database:')
      logger.error(disconnectError instanceof Error ? disconnectError.message : String(disconnectError))
    }
  }
}

// Execute the script if run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Unhandled error in main function:', error)
    process.exit(1)
  })
}

// Export functions for potential reuse
export { seedWorkspaceRoles, WORKSPACE_ADMIN_PERMISSIONS, WORKSPACE_NORMAL_PERMISSIONS }
