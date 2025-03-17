import { ObjectId } from 'mongodb'

interface ColumnSchema {
  _id?: ObjectId
  board_id: ObjectId
  title: string
  card_order_ids?: ObjectId[]
  _destroy?: boolean
  created_at?: Date
  updated_at?: Date
}

export default class Column {
  _id?: ObjectId
  board_id: ObjectId
  title: string
  card_order_ids: ObjectId[]
  _destroy: boolean
  created_at?: Date
  updated_at?: Date

  constructor(column: ColumnSchema) {
    const date = new Date()

    this._id = column._id
    this.board_id = column.board_id
    this.title = column.title
    this.card_order_ids = column.card_order_ids || []
    this._destroy = column._destroy || false
    this.created_at = column.created_at || date
    this.updated_at = column.updated_at || date
  }
}
