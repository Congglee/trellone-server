import { Server } from 'http'
import app from '~/app'
import { envConfig } from '~/config/environment'
import logger from '~/config/logger'

let server: Server

// Connect to MongoDB database

server = app.listen(envConfig.port, () => {
  logger.success(`Listening to port ${envConfig.port}`)
})

const exitHandler = async () => {
  if (server) {
    server.close(async () => {
      logger.info('Server closed')

      // Close database connection if needed
      logger.info('Database connection closed')

      process.exit(1)
    })
  } else {
    // Close database connection if needed
    logger.info('Database connection closed')

    process.exit(1)
  }
}

const unexpectedErrorHandler = (error: unknown) => {
  logger.error(error instanceof Error ? error.stack || error.message : String(error))
  exitHandler()
}

process.on('uncaughtException', unexpectedErrorHandler)
process.on('unhandledRejection', unexpectedErrorHandler)

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received')

  if (server) {
    server.close()
  }

  // Close database connection if needed
  logger.info('Database connection closed')
})
