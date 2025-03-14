import { Request, Response } from 'express'
import { BOARDS_MESSAGES } from '~/constants/messages'
import { BoardParams, CreateBoardReqBody } from '~/models/requests/Board.requests'
import boardsService from '~/services/boards.services'
import { ParamsDictionary } from 'express-serve-static-core'

export const createBoardController = async (req: Request<ParamsDictionary, any, CreateBoardReqBody>, res: Response) => {
  const result = await boardsService.createBoard(req.body)
  return res.json({ message: BOARDS_MESSAGES.CREATE_BOARD_SUCCESS, result })
}

export const getBoardController = async (req: Request<BoardParams>, res: Response) => {
  const { board_id } = req.params
  const result = await boardsService.getBoard(board_id)

  return res.json({ message: BOARDS_MESSAGES.GET_BOARD_SUCCESS, result })
}
