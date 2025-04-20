import { Router } from 'express'
import {
  createBoardController,
  getBoardController,
  getBoardsController,
  moveCardToDifferentColumnController,
  updateBoardController
} from '~/controllers/boards.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import {
  boardIdValidator,
  createBoardValidator,
  getBoardsValidator,
  moveCardToDifferentColumnValidator,
  updateBoardValidator
} from '~/middlewares/boards.middlewares'
import { filterMiddleware, paginationValidator } from '~/middlewares/common.middlewares'
import { UpdateBoardReqBody } from '~/models/requests/Board.requests'
import { wrapRequestHandler } from '~/utils/handlers'

const boardsRouter = Router()

boardsRouter.post('/', accessTokenValidator, createBoardValidator, wrapRequestHandler(createBoardController))

boardsRouter.get(
  '/',
  accessTokenValidator,
  paginationValidator,
  getBoardsValidator,
  wrapRequestHandler(getBoardsController)
)

boardsRouter.get('/:board_id', accessTokenValidator, boardIdValidator, wrapRequestHandler(getBoardController))

boardsRouter.put(
  '/:board_id',
  accessTokenValidator,
  boardIdValidator,
  updateBoardValidator,
  filterMiddleware<UpdateBoardReqBody>(['title', 'description', 'type', 'column_order_ids', 'cover_photo']),
  wrapRequestHandler(updateBoardController)
)

boardsRouter.put(
  '/supports/moving-card',
  accessTokenValidator,
  moveCardToDifferentColumnValidator,
  filterMiddleware([
    'current_card_id',
    'prev_column_id',
    'prev_card_order_ids',
    'next_column_id',
    'next_card_order_ids'
  ]),
  wrapRequestHandler(moveCardToDifferentColumnController)
)

export default boardsRouter
