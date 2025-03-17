import fs from 'fs'
import path from 'path'
import logger from '~/config/logger'
import { config } from 'dotenv'

const env = process.env.NODE_ENV
const envFilename = `.env.${env}`

if (!env) {
  logger.error(
    'You have not provided the NODE_ENV variable. Please provide it in the .env file. (example: NODE_ENV=development)'
  )
  logger.error(`Detect NODE_ENV = ${env}`)
  process.exit(1)
}

logger.info(`Detect NODE_ENV = ${env}, so the app will use ${envFilename} file`)

if (!fs.existsSync(path.resolve(envFilename))) {
  logger.error(`File ${envFilename} does not exist`)
  logger.error(
    `Please create a ${envFilename} file or run the app with another NODE_ENV (example: NODE_ENV=production)`
  )
  process.exit(1)
}

config({ path: envFilename })

export const environment = process.env.NODE_ENV || 'development'

export const envConfig = {
  port: (process.env.PORT as string) || '8000',
  host: (process.env.HOST as string) || 'http://localhost',

  dbName: process.env.DB_NAME as string,
  dbUsername: process.env.DB_USERNAME as string,
  dbPassword: process.env.DB_PASSWORD as string,

  dbBoardsCollection: process.env.DB_BOARDS_COLLECTION as string,
  dbColumnsCollection: process.env.DB_COLUMNS_COLLECTION as string,
  dbCardsCollection: process.env.DB_CARDS_COLLECTION as string
}
