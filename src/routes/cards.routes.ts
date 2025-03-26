import { Router } from 'express'
import { createCardController } from '~/controllers/cards.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { createCardValidator } from '~/middlewares/cards.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const cardsRouter = Router()

cardsRouter.post('/', accessTokenValidator, createCardValidator, wrapRequestHandler(createCardController))

export default cardsRouter
