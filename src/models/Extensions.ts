import { ObjectId } from 'mongodb'
import { AttachmentType, BoardInvitationStatus } from '~/constants/enums'

export interface Comment {
  comment_id: ObjectId
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

export interface Attachment {
  attachment_id: ObjectId
  type: AttachmentType
  uploaded_by: string
  file: {
    url: string
    display_name: string
    mime_type: string
    size: number
    original_name: string
  }
  link: {
    url: string
    display_name: string
    favicon_url: string
  }
  added_at: Date
}
