import { ObjectId } from 'mongodb'
import {
  CreateBoardReqBody,
  MoveCardToDifferentColumnReqBody,
  UpdateBoardReqBody
} from '~/models/requests/Board.requests'
import Board from '~/models/schemas/Board.schema'
import databaseService from '~/services/database.services'

class BoardsService {
  async createBoard(user_id: string, body: CreateBoardReqBody) {
    const result = await databaseService.boards.insertOne(
      new Board({
        title: body.title,
        description: body.description,
        type: body.type,
        owners: [new ObjectId(user_id)],
        workspace_id: new ObjectId(body.workspace_id)
      })
    )

    const board = await databaseService.boards.findOne({ _id: result.insertedId })

    return board
  }

  async getBoards({
    user_id,
    limit,
    page,
    keyword
  }: {
    user_id: string
    limit: number
    page: number
    keyword: string
  }) {
    const queryConditions: any[] = [
      {
        $or: [
          {
            owners: { $all: [new ObjectId(user_id)] }
          },
          {
            members: { $all: [new ObjectId(user_id)] }
          }
        ]
      },
      { _destroy: false }
    ]

    if (keyword) {
      queryConditions.push({
        title: { $regex: keyword, $options: 'i' }
      })
    }

    const [boards, total] = await Promise.all([
      await databaseService.boards
        .aggregate<Board>([
          { $match: { $and: queryConditions } },
          { $sort: { title: 1 } },
          { $skip: limit * (page - 1) },
          { $limit: limit }
        ])
        .toArray(),
      await databaseService.boards.countDocuments({ $and: queryConditions })
    ])

    return { boards, total }
  }

  async updateBoard(board_id: string, body: UpdateBoardReqBody) {
    const payload: any = { ...body }

    if (body.workspace_id) {
      payload.workspace_id = new ObjectId(body.workspace_id)
    }

    if (body.column_order_ids) {
      payload.column_order_ids = body.column_order_ids.map((id) => new ObjectId(id))
    }

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

  async moveCardToDifferentColumn(body: MoveCardToDifferentColumnReqBody) {
    const prev_card_order_ids = body.prev_card_order_ids.map((id) => new ObjectId(id))
    const next_card_order_ids = body.next_card_order_ids.map((id) => new ObjectId(id))

    // Step 1: Update the card_order_ids of Column originally contained it (understand the essence of deleting the card out of the array)
    await databaseService.columns.findOneAndUpdate(
      { _id: new ObjectId(body.prev_column_id) },
      {
        $set: { card_order_ids: prev_card_order_ids },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    // Step 2: Update card_order_ids of the next column (understand the nature of adding the card's _id to the array)
    await databaseService.columns.findOneAndUpdate(
      { _id: new ObjectId(body.next_column_id) },
      {
        $set: { card_order_ids: next_card_order_ids },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    // Step 3: Update the column_id of the card that has been dragged
    await databaseService.cards.findOneAndUpdate(
      { _id: new ObjectId(body.current_card_id) },
      {
        $set: { column_id: new ObjectId(body.next_column_id) },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return { message: 'Move card to different column successfully' }
  }
}

const boardsService = new BoardsService()

export default boardsService
