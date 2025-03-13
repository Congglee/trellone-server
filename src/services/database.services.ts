import { Collection, Db, MongoClient } from 'mongodb'
import { envConfig } from '~/config/environment'
import logger from '~/config/logger'
import Board from '~/models/schemas/Board.schema'

const URI = `mongodb+srv://${envConfig.dbUsername}:${envConfig.dbPassword}@trellone-cluster0.nnecc.mongodb.net/?retryWrites=true&w=majority&appName=${envConfig.dbName}`

class DatabaseService {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(URI)
    this.db = this.client.db(envConfig.dbName)
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 })
      logger.success('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log('Error', error)
      throw error
    }
  }

  async disconnect() {
    try {
      await this.client.close()
      logger.success('Disconnected from MongoDB')
    } catch (error) {
      console.log('Error', error)
      throw error
    }
  }

  get boards(): Collection<Board> {
    return this.db.collection<Board>(envConfig.dbBoardsCollection as string)
  }
}

const databaseService = new DatabaseService()

export default databaseService
