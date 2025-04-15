import { ParamsDictionary, Query } from 'express-serve-static-core'
import { BoardType } from '~/constants/enums'
import { Pagination } from '~/models/requests/Common.requests'

export interface CreateBoardReqBody {
  title: string
  description?: string
  type: BoardType
}

export interface BoardQuery extends Pagination, Query {
  keyword: string
}

export interface BoardParams extends ParamsDictionary {
  board_id: string
}

export interface UpdateBoardReqBody extends CreateBoardReqBody {
  column_order_ids: string[]
}

export interface MoveCardToDifferentColumnReqBody {
  current_card_id: string
  prev_column_id: string
  prev_card_order_ids: string[]
  next_column_id: string
  next_card_order_ids: string[]
}
