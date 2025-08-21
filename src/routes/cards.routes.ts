import { Router } from 'express'
import {
  addCardAttachmentController,
  addCardMemberController,
  addCardCommentController,
  createCardController,
  removeCardCommentController,
  deleteCardController,
  moveCardToDifferentColumnController,
  reactToCardCommentController,
  removeCardAttachmentController,
  removeCardMemberController,
  updateCardAttachmentController,
  updateCardCommentController,
  updateCardController
} from '~/controllers/cards.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import {
  addCardAttachmentValidator,
  addCardMemberValidator,
  attachmentIdValidator,
  cardIdValidator,
  commentIdValidator,
  addCardCommentValidator,
  createCardValidator,
  memberIdValidator,
  moveCardToDifferentColumnValidator,
  reactionToCardCommentValidator,
  updateCardAttachmentValidator,
  updateCardCommentValidator,
  updateCardValidator
} from '~/middlewares/cards.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { verifiedUserValidator } from '~/middlewares/users.middlewares'
import { ReactToCardCommentReqBody, UpdateCardReqBody } from '~/models/requests/Card.requests'
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
  filterMiddleware<UpdateCardReqBody>(['title', 'due_date', 'is_completed', 'description', 'cover_photo', '_destroy']),
  wrapRequestHandler(updateCardController)
)

cardsRouter.post(
  '/:card_id/comments',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  addCardCommentValidator,
  wrapRequestHandler(addCardCommentController)
)

cardsRouter.put(
  '/:card_id/comments/:comment_id',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  commentIdValidator,
  updateCardCommentValidator,
  wrapRequestHandler(updateCardCommentController)
)

cardsRouter.delete(
  '/:card_id/comments/:comment_id',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  commentIdValidator,
  wrapRequestHandler(removeCardCommentController)
)

cardsRouter.post(
  '/:card_id/attachments',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  addCardAttachmentValidator,
  wrapRequestHandler(addCardAttachmentController)
)

cardsRouter.put(
  '/:card_id/attachments/:attachment_id',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  attachmentIdValidator,
  updateCardAttachmentValidator,
  wrapRequestHandler(updateCardAttachmentController)
)

cardsRouter.delete(
  '/:card_id/attachments/:attachment_id',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  attachmentIdValidator,
  wrapRequestHandler(removeCardAttachmentController)
)

cardsRouter.post(
  '/:card_id/members',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  addCardMemberValidator,
  wrapRequestHandler(addCardMemberController)
)

cardsRouter.delete(
  '/:card_id/members/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  memberIdValidator,
  wrapRequestHandler(removeCardMemberController)
)

cardsRouter.put(
  '/:card_id/comments/:comment_id/reaction',
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
