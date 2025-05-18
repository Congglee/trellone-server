import { Router } from 'express'
import { createCardController, updateCardController } from '~/controllers/cards.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { cardIdValidator, createCardValidator, updateCardValidator } from '~/middlewares/cards.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { UpdateCardReqBody, updateCardReqBodyFields } from '~/models/requests/Card.requests'
import { wrapRequestHandler } from '~/utils/handlers'

const cardsRouter = Router()

cardsRouter.post('/', accessTokenValidator, createCardValidator, wrapRequestHandler(createCardController))

cardsRouter.put(
  '/:card_id',
  accessTokenValidator,
  cardIdValidator,
  updateCardValidator,
  filterMiddleware<UpdateCardReqBody>(updateCardReqBodyFields),
  wrapRequestHandler(updateCardController)
)

export default cardsRouter
