import { ParamsDictionary } from 'express-serve-static-core'

export interface CreateColumnReqBody {
  title: string
  board_id: string
}

export interface UpdateColumnReqBody {
  title: string
  card_order_ids: string[]
}

export interface ColumnParams extends ParamsDictionary {
  column_id: string
}
