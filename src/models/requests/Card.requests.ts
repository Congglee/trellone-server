import { ParamsDictionary } from 'express-serve-static-core'
import { AttachmentType, CardCommentReactionAction } from '~/constants/enums'

export interface CreateCardReqBody {
  title: string
  board_id: string
  column_id: string
}

export interface UpdateCardReqBody {
  title: string
  due_date?: Date | null
  is_completed?: boolean | null
  description?: string
  cover_photo?: string
}

export interface CardParams extends ParamsDictionary {
  card_id: string
}

export interface AddCardCommentReqBody {
  content: string
}

export interface CardCommentParams extends CardParams {
  comment_id: string
}

export interface UpdateCardCommentReqBody {
  content: string
}

export interface AddCardAttachmentReqBody {
  type: AttachmentType
  file: {
    url: string
    mime_type: string
    display_name: string
    size: number
    original_name: string
  }
  link: {
    url: string
    display_name: string
    favicon_url: string
  }
}

export interface CardAttachmentParams extends CardParams {
  attachment_id: string
}

export interface UpdateCardAttachmentReqBody {
  type: AttachmentType
  file: {
    url: string
    mime_type: string
    display_name: string
    size: number
    original_name: string
  }
  link: {
    url: string
    display_name: string
    favicon_url: string
  }
}

export interface AddCardMemberReqBody {
  user_id: string
}

export interface CardMemberParams extends CardParams {
  user_id: string
}

export interface ReactToCardCommentReqBody {
  action: CardCommentReactionAction
  emoji: string
  reaction_id?: string
}

export interface CardCommentReactionParams extends CardParams {
  comment_id: string
}

export interface MoveCardToDifferentColumnReqBody {
  current_card_id: string
  prev_column_id: string
  prev_card_order_ids: string[]
  next_column_id: string
  next_card_order_ids: string[]
}
