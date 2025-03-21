import { ObjectId } from 'mongodb'
import { CreateBoardReqBody, UpdateBoardReqBody } from '~/models/requests/Board.requests'
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

  async updateBoard(board_id: string, body: UpdateBoardReqBody) {
    const payload = body.column_order_ids
      ? { ...body, column_order_ids: body.column_order_ids.map((id) => new ObjectId(id)) }
      : (body as UpdateBoardReqBody & { column_order_ids: ObjectId[] })

    const board = await databaseService.boards.findOneAndUpdate(
      { _id: new ObjectId(board_id) },
      {
        $set: payload,
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return board
  }
}

const boardsService = new BoardsService()

export default boardsService
