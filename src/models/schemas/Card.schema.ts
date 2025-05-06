import { ObjectId } from 'mongodb'
import { Comment } from '~/models/Extensions'

interface CardSchema {
  _id?: ObjectId
  board_id: ObjectId
  column_id: ObjectId
  title: string
  description?: string
  due_date?: Date | null
  is_completed?: boolean | null
  cover_photo?: string
  members?: ObjectId[]
  comments?: Comment[]
  // attachments?: ObjectId[]
  _destroy?: boolean
  created_at?: Date
  updated_at?: Date
}

export default class Card {
  _id?: ObjectId
  board_id: ObjectId
  column_id: ObjectId
  title: string
  description: string
  due_date: Date | null
  is_completed: boolean | null
  cover_photo: string
  members: ObjectId[]
  comments: Comment[]
  // attachments: ObjectId[]
  _destroy: boolean
  created_at?: Date
  updated_at?: Date

  constructor(card: CardSchema) {
    const date = new Date()

    this._id = card._id
    this.board_id = card.board_id
    this.column_id = card.column_id
    this.title = card.title
    this.description = card.description || ''
    this.due_date = card.due_date || null
    this.is_completed = card.is_completed || null
    this.cover_photo = card.cover_photo || ''
    this.members = card.members || []
    this.comments = card.comments || []
    // this.attachments = card.attachments || []
    this._destroy = card._destroy || false
    this.created_at = card.created_at || date
    this.updated_at = card.updated_at || date
  }
}
