import { Router } from 'express'
import {
  createColumnController,
  deleteColumnController,
  updateColumnController
} from '~/controllers/columns.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { columnIdValidator, createColumnValidator, updateColumnValidator } from '~/middlewares/columns.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { verifiedUserValidator } from '~/middlewares/users.middlewares'
import { UpdateColumnReqBody } from '~/models/requests/Column.requests'
import { wrapRequestHandler } from '~/utils/handlers'

const columnsRouter = Router()

columnsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createColumnValidator,
  wrapRequestHandler(createColumnController)
)

columnsRouter.put(
  '/:column_id',
  accessTokenValidator,
  verifiedUserValidator,
  columnIdValidator,
  updateColumnValidator,
  filterMiddleware<UpdateColumnReqBody>(['title', 'card_order_ids']),
  wrapRequestHandler(updateColumnController)
)

columnsRouter.delete(
  '/:column_id',
  accessTokenValidator,
  verifiedUserValidator,
  columnIdValidator,
  wrapRequestHandler(deleteColumnController)
)

export default columnsRouter
