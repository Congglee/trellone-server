import { ObjectId } from 'mongodb'
import { CreateColumnReqBody, UpdateColumnReqBody } from '~/models/requests/Column.requests'
import Column from '~/models/schemas/Column.schema'
import databaseService from '~/services/database.services'

class ColumnsService {
  async createColumn(body: CreateColumnReqBody) {
    const result = await databaseService.columns.insertOne(
      new Column({
        title: body.title,
        board_id: new ObjectId(body.board_id)
      })
    )

    const column = await databaseService.columns.findOne({ _id: result.insertedId })

    await databaseService.boards.updateOne(
      { _id: new ObjectId(body.board_id) },
      { $push: { column_order_ids: result.insertedId } }
    )

    return { ...column, cards: [] }
  }

  async updateColumn(column_id: string, body: UpdateColumnReqBody) {
    const payload = body.card_order_ids
      ? { ...body, card_order_ids: body.card_order_ids.map((id) => new ObjectId(id)) }
      : (body as UpdateColumnReqBody & { card_order_ids: ObjectId[] })

    const column = await databaseService.columns.findOneAndUpdate(
      { _id: new ObjectId(column_id) },
      {
        $set: payload,
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return column
  }
}

const columnsService = new ColumnsService()

export default columnsService
