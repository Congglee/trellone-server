import { ObjectId } from 'mongodb'
import { CreateBoardReqBody } from '~/models/requests/Board.requests'
import Board from '~/models/schemas/Board.schema'
import databaseService from '~/services/database.services'

class BoardsService {
  async createBoard(body: CreateBoardReqBody) {
    const result = await databaseService.boards.insertOne(
      new Board({
        title: body.title,
        description: body.description,
        type: body.type
      })
    )

    const board = await databaseService.boards.findOne({ _id: result.insertedId })

    return board
  }

  async getBoard(board_id: string) {
    const board = await databaseService.boards.findOne({ _id: new ObjectId(board_id) })
    return board
  }
}

const boardsService = new BoardsService()

export default boardsService
