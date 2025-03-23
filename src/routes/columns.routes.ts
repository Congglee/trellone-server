import { Router } from 'express'
import {
  createColumnController,
  deleteColumnController,
  updateColumnController
} from '~/controllers/columns.controllers'
import { columnIdValidator, createColumnValidator, updateColumnValidator } from '~/middlewares/columns.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { UpdateColumnReqBody } from '~/models/requests/Column.requests'
import { wrapRequestHandler } from '~/utils/handlers'

const columnsRouter = Router()

columnsRouter.post('/', createColumnValidator, wrapRequestHandler(createColumnController))

columnsRouter.put(
  '/:column_id',
  columnIdValidator,
  updateColumnValidator,
  filterMiddleware<UpdateColumnReqBody>(['title', 'card_order_ids']),
  wrapRequestHandler(updateColumnController)
)

columnsRouter.delete('/:column_id', columnIdValidator, wrapRequestHandler(deleteColumnController))

export default columnsRouter
