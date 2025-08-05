import { ParamsDictionary } from 'express-serve-static-core'
import { CardAttachmentAction, CardCommentAction, CardCommentReactionAction, CardMemberAction } from '~/constants/enums'
import { FilterKeys } from '~/middlewares/common.middlewares'
import { Attachment } from '~/models/Extensions'

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
  _destroy?: boolean
  comment?: {
    action: CardCommentAction
    content: string
    comment_id?: string
  }
  member?: {
    action: CardMemberAction
    user_id: string
  }
  attachment?: Omit<Attachment, 'uploaded_by' | 'added_at'> & {
    action?: CardAttachmentAction
  }
}

export const updateCardReqBodyFields = [
  'title',
  'due_date',
  'is_completed',
  'description',
  'cover_photo',
  'comment',
  'attachment',
  'member',
  '_destroy'
] as FilterKeys<UpdateCardReqBody>

export interface CardParams extends ParamsDictionary {
  card_id: string
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
