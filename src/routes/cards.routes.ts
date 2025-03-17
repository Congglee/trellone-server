import { Router } from 'express'
import { createCardController } from '~/controllers/cards.controllers'
import { createCardValidator } from '~/middlewares/cards.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const cardsRouter = Router()

cardsRouter.post('/', createCardValidator, wrapRequestHandler(createCardController))

export default cardsRouter
