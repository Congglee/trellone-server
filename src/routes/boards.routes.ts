import { Router } from 'express'
import {
  createBoardController,
  getBoardController,
  getBoardsController,
  updateBoardController
} from '~/controllers/boards.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import {
  boardIdValidator,
  createBoardValidator,
  getBoardsValidator,
  updateBoardValidator
} from '~/middlewares/boards.middlewares'
import { filterMiddleware, paginationValidator } from '~/middlewares/common.middlewares'
import { verifiedUserValidator } from '~/middlewares/users.middlewares'
import { UpdateBoardReqBody } from '~/models/requests/Board.requests'
import { wrapRequestHandler } from '~/utils/handlers'
import { requireBoardPermission } from '~/middlewares/rbac.middlewares'
import { BoardPermission } from '~/constants/permissions'

const boardsRouter = Router()

boardsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createBoardValidator,
  wrapRequestHandler(createBoardController)
)

boardsRouter.get(
  '/',
  accessTokenValidator,
  paginationValidator,
  getBoardsValidator,
  wrapRequestHandler(getBoardsController)
)

boardsRouter.get(
  '/:board_id',
  accessTokenValidator,
  verifiedUserValidator,
  boardIdValidator,
  requireBoardPermission(BoardPermission.ViewBoard),
  wrapRequestHandler(getBoardController)
)

boardsRouter.put(
  '/:board_id',
  accessTokenValidator,
  verifiedUserValidator,
  boardIdValidator,
  updateBoardValidator,
  filterMiddleware<UpdateBoardReqBody>([
    'title',
    'description',
    'type',
    'workspace_id',
    'column_order_ids',
    'cover_photo'
  ]),
  requireBoardPermission(BoardPermission.ManageBoard),
  wrapRequestHandler(updateBoardController)
)

export default boardsRouter
