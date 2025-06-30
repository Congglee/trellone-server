import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { CARDS_MESSAGES } from '~/constants/messages'
import {
  CardCommentReactionParams,
  CardParams,
  CreateCardReqBody,
  ReactToCardCommentReqBody,
  UpdateCardReqBody
} from '~/models/requests/Card.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import cardsService from '~/services/cards.services'

export const createCardController = async (req: Request<ParamsDictionary, any, CreateCardReqBody>, res: Response) => {
  const result = await cardsService.createCard(req.body)
  return res.json({ message: CARDS_MESSAGES.CREATE_CARD_SUCCESS, result })
}

export const updateCardController = async (req: Request<CardParams, any, UpdateCardReqBody>, res: Response) => {
  const { card_id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayload

  const result = await cardsService.updateCard(card_id, user_id, req.body)

  return res.json({ message: CARDS_MESSAGES.UPDATE_CARD_SUCCESS, result })
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
