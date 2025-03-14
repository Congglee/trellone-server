import { ParamsDictionary } from 'express-serve-static-core'
import { BoardType } from '~/constants/enums'

export interface CreateBoardReqBody {
  title: string
  description?: string
  type: BoardType
}

export interface BoardParams extends ParamsDictionary {
  board_id: string
}
