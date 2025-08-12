import { Router } from 'express'
import {
  createCardController,
  deleteCardController,
  moveCardToDifferentColumnController,
  reactToCardCommentController,
  updateCardController
} from '~/controllers/cards.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import {
  cardIdValidator,
  commentIdValidator,
  createCardValidator,
  moveCardToDifferentColumnValidator,
  reactionToCardCommentValidator,
  updateCardValidator
} from '~/middlewares/cards.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { verifiedUserValidator } from '~/middlewares/users.middlewares'
import { ReactToCardCommentReqBody, UpdateCardReqBody, updateCardReqBodyFields } from '~/models/requests/Card.requests'
import { wrapRequestHandler } from '~/utils/handlers'

const cardsRouter = Router()

cardsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createCardValidator,
  wrapRequestHandler(createCardController)
)

cardsRouter.put(
  '/:card_id',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  updateCardValidator,
  filterMiddleware<UpdateCardReqBody>(updateCardReqBodyFields),
  wrapRequestHandler(updateCardController)
)

cardsRouter.put(
  '/:card_id/comment/:comment_id/reaction',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  commentIdValidator,
  reactionToCardCommentValidator,
  filterMiddleware<ReactToCardCommentReqBody>(['action', 'emoji', 'reaction_id']),
  wrapRequestHandler(reactToCardCommentController)
)

cardsRouter.delete(
  '/:card_id',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  wrapRequestHandler(deleteCardController)
)

cardsRouter.put(
  '/supports/moving-card',
  accessTokenValidator,
  verifiedUserValidator,
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

export default cardsRouter
