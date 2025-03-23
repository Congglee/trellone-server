import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { CARDS_MESSAGES } from '~/constants/messages'
import { CreateCardReqBody } from '~/models/requests/Card.requests'
import cardsService from '~/services/cards.services'

export const createCardController = async (req: Request<ParamsDictionary, any, CreateCardReqBody>, res: Response) => {
  const result = await cardsService.createCard(req.body)
  return res.json({ message: CARDS_MESSAGES.CREATE_CARD_SUCCESS, result })
}
