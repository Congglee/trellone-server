import { Router } from 'express'
import { createBoardController, getBoardController } from '~/controllers/boards.controllers'
import { boardIdValidator, createBoardValidator } from '~/middlewares/boards.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const boardsRouter = Router()

boardsRouter.post('/', createBoardValidator, wrapRequestHandler(createBoardController))

boardsRouter.get('/:board_id', boardIdValidator, wrapRequestHandler(getBoardController))

export default boardsRouter
