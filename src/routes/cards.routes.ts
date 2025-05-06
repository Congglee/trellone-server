import { Router } from 'express'
import { createCardController, updateCardController } from '~/controllers/cards.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { cardIdValidator, createCardValidator, updateCardValidator } from '~/middlewares/cards.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { UpdateCardReqBody } from '~/models/requests/Card.requests'
import { wrapRequestHandler } from '~/utils/handlers'

const cardsRouter = Router()

cardsRouter.post('/', accessTokenValidator, createCardValidator, wrapRequestHandler(createCardController))

cardsRouter.put(
  '/:card_id',
  accessTokenValidator,
  cardIdValidator,
  updateCardValidator,
  filterMiddleware<UpdateCardReqBody>([
    'title',
    'due_date',
    'is_completed',
    'description',
    'cover_photo',
    'comment',
    'member',
    '_destroy'
  ]),
  wrapRequestHandler(updateCardController)
)

export default cardsRouter
