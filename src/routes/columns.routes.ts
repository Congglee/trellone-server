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
import { requireBoardPermissionFromBody, requireColumnPermission } from '~/middlewares/rbac.middlewares'
import { BoardPermission } from '~/constants/permissions'

const columnsRouter = Router()

columnsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createColumnValidator,
  requireBoardPermissionFromBody(BoardPermission.CreateColumn, 'board_id'),
  wrapRequestHandler(createColumnController)
)

columnsRouter.put(
  '/:column_id',
  accessTokenValidator,
  verifiedUserValidator,
  columnIdValidator,
  updateColumnValidator,
  filterMiddleware<UpdateColumnReqBody>(['title', 'card_order_ids']),
  requireColumnPermission([BoardPermission.EditColumn, BoardPermission.ReorderCardInTheSameColumn]),
  wrapRequestHandler(updateColumnController)
)

columnsRouter.delete(
  '/:column_id',
  accessTokenValidator,
  verifiedUserValidator,
  columnIdValidator,
  requireColumnPermission(BoardPermission.DeleteColumn),
  wrapRequestHandler(deleteColumnController)
)

export default columnsRouter
