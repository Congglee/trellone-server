import { ObjectId } from 'mongodb'

export interface Comment {
  user_id: ObjectId
  user_email: string
  user_avatar: string
  user_display_name: string
  content: string
  commented_at: Date
}
