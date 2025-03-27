import { ObjectId } from 'mongodb'
import { BoardType } from '~/constants/enums'

interface BoardSchema {
  _id?: ObjectId
  title: string
  description?: string
  type: BoardType
  cover_photo?: string
  // workspace_id: ObjectId
  column_order_ids?: ObjectId[]
  owners: ObjectId[]
  members?: ObjectId[]
  _destroy?: boolean
  created_at?: Date
  updated_at?: Date
}

export default class Board {
  _id?: ObjectId
  title: string
  description: string
  type: BoardType
  cover_photo: string
  // workspace_id: ObjectId
  column_order_ids: ObjectId[]
  owners: ObjectId[]
  members: ObjectId[]
  _destroy: boolean
  created_at?: Date
  updated_at?: Date

  constructor(board: BoardSchema) {
    const date = new Date()

    this._id = board._id
    this.title = board.title
    this.description = board.description || ''
    this.type = board.type || BoardType.Public
    this.cover_photo = board.cover_photo || ''
    this.column_order_ids = board.column_order_ids || []
    this.owners = board.owners || []
    this.members = board.members || []
    this._destroy = board._destroy || false
    this.created_at = board.created_at || date
    this.updated_at = board.updated_at || date
  }
}
