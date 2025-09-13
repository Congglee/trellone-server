import { ParamsDictionary, Query } from 'express-serve-static-core'
import { BoardType } from '~/constants/enums'
import { Pagination } from '~/models/requests/Common.requests'

export interface CreateBoardReqBody {
  title: string
  description?: string
  type: BoardType
  workspace_id: string
}

export interface BoardQuery extends Pagination, Query {
  keyword: string
}

export interface BoardParams extends ParamsDictionary {
  board_id: string
}

export interface JoinedWorkspaceBoardQuery extends Pagination, Query {
  workspace_id: string
}

export interface UpdateBoardReqBody extends CreateBoardReqBody {
  column_order_ids: string[]
  cover_photo?: string
  _destroy?: boolean
}
