import { Request, Response } from 'express'
import { BOARDS_MESSAGES } from '~/constants/messages'
import {
  BoardParams,
  CreateBoardReqBody,
  MoveCardToDifferentColumnReqBody,
  UpdateBoardReqBody
} from '~/models/requests/Board.requests'
import boardsService from '~/services/boards.services'
import { ParamsDictionary } from 'express-serve-static-core'

export const createBoardController = async (req: Request<ParamsDictionary, any, CreateBoardReqBody>, res: Response) => {
  const user_id = req.decoded_authorization?.user_id as string
  const result = await boardsService.createBoard(user_id, req.body)

  return res.json({ message: BOARDS_MESSAGES.CREATE_BOARD_SUCCESS, result })
}

export const getBoardController = async (req: Request<BoardParams>, res: Response) => {
  const result = { ...req.board }

  return res.json({ message: BOARDS_MESSAGES.GET_BOARD_SUCCESS, result })
}

export const updateBoardController = async (req: Request<BoardParams, any, UpdateBoardReqBody>, res: Response) => {
  const { board_id } = req.params
  const result = await boardsService.updateBoard(board_id, req.body)

  return res.json({ message: BOARDS_MESSAGES.UPDATE_BOARD_SUCCESS, result })
}

export const moveCardToDifferentColumnController = async (
  req: Request<ParamsDictionary, any, MoveCardToDifferentColumnReqBody>,
  res: Response
) => {
  const result = await boardsService.moveCardToDifferentColumn(req.body)
  return res.json(result)
}
