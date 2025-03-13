import { Router } from 'express'
import { createBoardController } from '~/controllers/boards.controllers'
import { createBoardValidator } from '~/middlewares/boards.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const boardsRouter = Router()

boardsRouter.post('/', createBoardValidator, wrapRequestHandler(createBoardController))

export default boardsRouter
