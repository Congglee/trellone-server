import { ObjectId } from 'mongodb'
import { BoardInvitationStatus } from '~/constants/enums'

export interface Comment {
  user_id: string
  user_email: string
  user_avatar: string
  user_display_name: string
  content: string
  commented_at: Date
}

export interface BoardInvitation {
  board_id: ObjectId
  status: BoardInvitationStatus
}
