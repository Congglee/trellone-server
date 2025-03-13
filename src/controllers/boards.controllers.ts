import { Request, Response } from 'express'
import { BOARDS_MESSAGES } from '~/constants/messages'
import boardsService from '~/services/boards.services'

export const createBoardController = async (req: Request, res: Response) => {
  const result = await boardsService.createBoard(req.body)

  return res.json({ message: BOARDS_MESSAGES.CREATE_BOARD_SUCCESS, result })
}
