import { Router } from 'express'
import {
  createBoardController,
  getBoardController,
  moveCardToDifferentColumnController,
  updateBoardController
} from '~/controllers/boards.controllers'
import {
  boardIdValidator,
  createBoardValidator,
  moveCardToDifferentColumnValidator,
  updateBoardValidator
} from '~/middlewares/boards.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { UpdateBoardReqBody } from '~/models/requests/Board.requests'
import { wrapRequestHandler } from '~/utils/handlers'

const boardsRouter = Router()

boardsRouter.post('/', createBoardValidator, wrapRequestHandler(createBoardController))

boardsRouter.get('/:board_id', boardIdValidator, wrapRequestHandler(getBoardController))

boardsRouter.put(
  '/:board_id',
  boardIdValidator,
  updateBoardValidator,
  filterMiddleware<UpdateBoardReqBody>(['title', 'description', 'type', 'column_order_ids']),
  wrapRequestHandler(updateBoardController)
)

boardsRouter.put(
  '/supports/moving-card',
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
