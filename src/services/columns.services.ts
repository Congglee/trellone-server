import { ObjectId } from 'mongodb'
import { CreateColumnReqBody } from '~/models/requests/Column.requests'
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
}

const columnsService = new ColumnsService()

export default columnsService
