import { ParamsDictionary, Query } from 'express-serve-static-core'
import { BoardRole, BoardType } from '~/constants/enums'
import { Pagination } from '~/models/requests/Common.requests'

export interface CreateBoardReqBody {
  title: string
  description?: string
  type: BoardType
  cover_photo?: string
  workspace_id: string
}

export interface BoardQuery extends Pagination, Query {
  keyword: string
  state?: string
  workspace?: string
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
  background_color?: string
  _destroy?: boolean
}

export interface EditBoardMemberRoleReqBody {
  role: BoardRole
}

export interface BoardMemberParams extends BoardParams {
  user_id: string
}
