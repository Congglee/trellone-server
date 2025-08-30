import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { CARDS_MESSAGES } from '~/constants/messages'
import {
  AddCardAttachmentReqBody,
  AddCardMemberReqBody,
  CardAttachmentParams,
  CardCommentParams,
  CardCommentReactionParams,
  CardMemberParams,
  CardParams,
  AddCardCommentReqBody,
  CreateCardReqBody,
  MoveCardToDifferentColumnReqBody,
  ReactToCardCommentReqBody,
  UpdateCardAttachmentReqBody,
  UpdateCardCommentReqBody,
  UpdateCardReqBody
} from '~/models/requests/Card.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import Card from '~/models/schemas/Card.schema'
import cardsService from '~/services/cards.services'

export const createCardController = async (req: Request<ParamsDictionary, any, CreateCardReqBody>, res: Response) => {
  const result = await cardsService.createCard(req.body)
  return res.json({ message: CARDS_MESSAGES.CREATE_CARD_SUCCESS, result })
}

export const updateCardController = async (req: Request<CardParams, any, UpdateCardReqBody>, res: Response) => {
  const { card_id } = req.params

  const result = await cardsService.updateCard(card_id, req.body)

  return res.json({ message: CARDS_MESSAGES.UPDATE_CARD_SUCCESS, result })
}

export const addCardCommentController = async (req: Request<CardParams, any, AddCardCommentReqBody>, res: Response) => {
  const { card_id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayload

  const result = await cardsService.addCardComment({ card_id, user_id, body: req.body })

  return res.json({ message: CARDS_MESSAGES.ADD_CARD_COMMENT_SUCCESS, result })
}

export const updateCardCommentController = async (
  req: Request<CardCommentParams, any, UpdateCardCommentReqBody>,
  res: Response
) => {
  const { card_id, comment_id } = req.params

  const result = await cardsService.updateCardComment({
    card_id,
    comment_id,
    body: req.body
  })

  return res.json({ message: CARDS_MESSAGES.UPDATE_CARD_COMMENT_SUCCESS, result })
}

export const removeCardCommentController = async (req: Request<CardCommentParams>, res: Response) => {
  const { card_id, comment_id } = req.params

  const result = await cardsService.removeCardComment(card_id, comment_id)

  return res.json({ message: CARDS_MESSAGES.REMOVE_CARD_COMMENT_SUCCESS, result })
}

export const addCardAttachmentController = async (
  req: Request<CardParams, any, AddCardAttachmentReqBody>,
  res: Response
) => {
  const { card_id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayload

  const result = await cardsService.addCardAttachment({ card_id, user_id, body: req.body })

  return res.json({ message: CARDS_MESSAGES.ADD_CARD_ATTACHMENT_SUCCESS, result })
}

export const updateCardAttachmentController = async (
  req: Request<CardAttachmentParams, any, UpdateCardAttachmentReqBody>,
  res: Response
) => {
  const { card_id, attachment_id } = req.params

  const result = await cardsService.updateCardAttachment({ card_id, attachment_id, body: req.body })

  return res.json({ message: CARDS_MESSAGES.UPDATE_CARD_ATTACHMENT_SUCCESS, result })
}

export const removeCardAttachmentController = async (req: Request<CardAttachmentParams>, res: Response) => {
  const { card_id, attachment_id } = req.params

  const result = await cardsService.removeAttachment(card_id, attachment_id)

  return res.json({ message: CARDS_MESSAGES.REMOVE_ATTACHMENT_SUCCESS, result })
}

export const addCardMemberController = async (req: Request<CardParams, any, AddCardMemberReqBody>, res: Response) => {
  const { card_id } = req.params

  const result = await cardsService.addCardMember(card_id, req.body)

  return res.json({ message: CARDS_MESSAGES.ADD_CARD_MEMBER_SUCCESS, result })
}

export const removeCardMemberController = async (req: Request<CardMemberParams>, res: Response) => {
  const { card_id, user_id } = req.params

  const result = await cardsService.removeCardMember(card_id, user_id)

  return res.json({ message: CARDS_MESSAGES.REMOVE_CARD_MEMBER_SUCCESS, result })
}

export const reactToCardCommentController = async (
  req: Request<CardCommentReactionParams, any, ReactToCardCommentReqBody>,
  res: Response
) => {
  const { card_id, comment_id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayload

  const result = await cardsService.reactToCardComment({ card_id, user_id, comment_id, body: req.body })

  return res.json({ message: CARDS_MESSAGES.REACT_CARD_COMMENT_SUCCESS, result })
}

export const deleteCardController = async (req: Request<CardParams>, res: Response) => {
  const { card_id } = req.params
  const column_id = (req.card as Card & { column_id: string }).column_id

  await cardsService.deleteCard(card_id, column_id)

  return res.json({ message: CARDS_MESSAGES.DELETE_CARD_SUCCESS })
}

export const moveCardToDifferentColumnController = async (
  req: Request<ParamsDictionary, any, MoveCardToDifferentColumnReqBody>,
  res: Response
) => {
  const result = await cardsService.moveCardToDifferentColumn(req.body)
  return res.json(result)
}
