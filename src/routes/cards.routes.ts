import { Router } from 'express'
import {
  addCardAttachmentController,
  addCardMemberController,
  addCardCommentController,
  createCardController,
  archiveCardController,
  reopenCardController,
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
  cardMemberIdValidator,
  moveCardToDifferentColumnValidator,
  reactionToCardCommentValidator,
  updateCardAttachmentValidator,
  updateCardCommentValidator,
  updateCardValidator,
  ensureCardOpen,
  ensureCardClosed
} from '~/middlewares/cards.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { verifiedUserValidator } from '~/middlewares/users.middlewares'
import { ReactToCardCommentReqBody, UpdateCardReqBody } from '~/models/requests/Card.requests'
import { wrapRequestHandler } from '~/utils/handlers'
import {
  requireBoardPermissionFromBody,
  requireCardPermission,
  requireCardPermissionFromBody
} from '~/middlewares/rbac.middlewares'
import { BoardPermission } from '~/constants/permissions'

const cardsRouter = Router()

cardsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createCardValidator,
  requireBoardPermissionFromBody(BoardPermission.CreateCard, 'board_id'),
  wrapRequestHandler(createCardController)
)

cardsRouter.put(
  '/:card_id',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  ensureCardOpen,
  updateCardValidator,
  filterMiddleware<UpdateCardReqBody>(['title', 'due_date', 'is_completed', 'description', 'cover_photo']),
  requireCardPermission(BoardPermission.EditCard),
  wrapRequestHandler(updateCardController)
)

cardsRouter.patch(
  '/:card_id/archive',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  ensureCardOpen,
  requireCardPermission(BoardPermission.EditCard),
  wrapRequestHandler(archiveCardController)
)

cardsRouter.patch(
  '/:card_id/reopen',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  ensureCardClosed,
  requireCardPermission(BoardPermission.EditCard, { allowClosed: true }),
  wrapRequestHandler(reopenCardController)
)

cardsRouter.post(
  '/:card_id/comments',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  addCardCommentValidator,
  requireCardPermission(BoardPermission.Comment),
  wrapRequestHandler(addCardCommentController)
)

cardsRouter.put(
  '/:card_id/comments/:comment_id',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  commentIdValidator,
  updateCardCommentValidator,
  requireCardPermission(BoardPermission.Comment),
  wrapRequestHandler(updateCardCommentController)
)

cardsRouter.delete(
  '/:card_id/comments/:comment_id',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  commentIdValidator,
  requireCardPermission(BoardPermission.Comment),
  wrapRequestHandler(removeCardCommentController)
)

cardsRouter.post(
  '/:card_id/attachments',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  addCardAttachmentValidator,
  requireCardPermission(BoardPermission.Attach),
  wrapRequestHandler(addCardAttachmentController)
)

cardsRouter.put(
  '/:card_id/attachments/:attachment_id',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  attachmentIdValidator,
  updateCardAttachmentValidator,
  requireCardPermission(BoardPermission.Attach),
  wrapRequestHandler(updateCardAttachmentController)
)

cardsRouter.delete(
  '/:card_id/attachments/:attachment_id',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  attachmentIdValidator,
  requireCardPermission(BoardPermission.Attach),
  wrapRequestHandler(removeCardAttachmentController)
)

cardsRouter.post(
  '/:card_id/members',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  addCardMemberValidator,
  requireCardPermission(BoardPermission.EditCard),
  wrapRequestHandler(addCardMemberController)
)

cardsRouter.delete(
  '/:card_id/members/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  cardMemberIdValidator,
  requireCardPermission(BoardPermission.EditCard),
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
  requireCardPermission(BoardPermission.Comment),
  wrapRequestHandler(reactToCardCommentController)
)

cardsRouter.delete(
  '/:card_id',
  accessTokenValidator,
  verifiedUserValidator,
  cardIdValidator,
  ensureCardClosed,
  requireCardPermission(BoardPermission.DeleteCard),
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
  requireCardPermissionFromBody(BoardPermission.MoveCardToDifferentColumn, 'current_card_id'),
  wrapRequestHandler(moveCardToDifferentColumnController)
)

export default cardsRouter
