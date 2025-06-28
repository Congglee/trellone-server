import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { ColumnParams, CreateColumnReqBody, UpdateColumnReqBody } from '~/models/requests/Column.requests'
import { COLUMNS_MESSAGES } from '~/constants/messages'
import columnsService from '~/services/columns.services'
import Column from '~/models/schemas/Column.schema'

export const createColumnController = async (
  req: Request<ParamsDictionary, any, CreateColumnReqBody>,
  res: Response
) => {
  const result = await columnsService.createColumn(req.body)
  return res.json({ message: COLUMNS_MESSAGES.CREATE_COLUMN_SUCCESS, result })
}

export const updateColumnController = async (req: Request<ColumnParams, any, UpdateColumnReqBody>, res: Response) => {
  const { column_id } = req.params
  const result = await columnsService.updateColumn(column_id, req.body)
  return res.json({ message: COLUMNS_MESSAGES.UPDATE_COLUMN_SUCCESS, result })
}

export const deleteColumnController = async (req: Request<ColumnParams, any, any>, res: Response) => {
  const { column_id } = req.params
  const board_id = (req.column as Column & { board_id: string }).board_id

  await columnsService.deleteColumn(column_id, board_id)

  return res.json({ message: COLUMNS_MESSAGES.DELETE_COLUMN_SUCCESS })
}
