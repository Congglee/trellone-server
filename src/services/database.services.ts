import { Collection, Db, MongoClient } from 'mongodb'
import { envConfig } from '~/config/environment'
import logger from '~/config/logger'
import Board from '~/models/schemas/Board.schema'
import Card from '~/models/schemas/Card.schema'
import Column from '~/models/schemas/Column.schema'
import Invitation from '~/models/schemas/Invitation.schema'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import User from '~/models/schemas/User.schema'
import Workspace from '~/models/schemas/Workspace.schema'

class DatabaseService {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(envConfig.dbUri)
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

  get workspaces(): Collection<Workspace> {
    return this.db.collection<Workspace>(envConfig.dbWorkspacesCollection as string)
  }

  get boards(): Collection<Board> {
    return this.db.collection<Board>(envConfig.dbBoardsCollection as string)
  }

  get columns(): Collection<Column> {
    return this.db.collection<Column>(envConfig.dbColumnsCollection as string)
  }

  get cards(): Collection<Card> {
    return this.db.collection<Card>(envConfig.dbCardsCollection as string)
  }

  get users(): Collection<User> {
    return this.db.collection<User>(envConfig.dbUsersCollection as string)
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection<RefreshToken>(envConfig.dbRefreshTokensCollection as string)
  }

  get invitations(): Collection<Invitation> {
    return this.db.collection<Invitation>(envConfig.dbInvitationsCollection as string)
  }
}

const databaseService = new DatabaseService()

export default databaseService
