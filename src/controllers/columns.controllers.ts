import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { CreateColumnReqBody } from '~/models/requests/Column.requests'
import { COLUMNS_MESSAGES } from '~/constants/messages'
import columnsService from '~/services/columns.services'

export const createColumnController = async (
  req: Request<ParamsDictionary, any, CreateColumnReqBody>,
  res: Response
) => {
  const result = await columnsService.createColumn(req.body)
  return res.json({ message: COLUMNS_MESSAGES.CREATE_COLUMN_SUCCESS, result })
}
