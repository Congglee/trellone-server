import { ParamsDictionary } from 'express-serve-static-core'
import { CardMemberAction } from '~/constants/enums'
import { Comment } from '~/models/Extensions'

export interface CreateCardReqBody {
  title: string
  board_id: string
  column_id: string
}

export interface UpdateCardReqBody {
  title: string
  description?: string
  cover_photo?: string
  _destroy?: boolean
  comment?: Comment
  member?: {
    action: CardMemberAction
    user_id: string
  }
}

export interface CardParams extends ParamsDictionary {
  card_id: string
}
