import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { BOARDS_MESSAGES } from '~/constants/messages'
import {
  BoardParams,
  BoardQuery,
  CreateBoardReqBody,
  JoinedWorkspaceBoardQuery,
  UpdateBoardReqBody
} from '~/models/requests/Board.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import boardsService from '~/services/boards.services'

export const createBoardController = async (req: Request<ParamsDictionary, any, CreateBoardReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await boardsService.createBoard(user_id, req.body)
  return res.json({ message: BOARDS_MESSAGES.CREATE_BOARD_SUCCESS, result })
}

export const getBoardsController = async (req: Request<ParamsDictionary, any, any, BoardQuery>, res: Response) => {
  const user_id = req.decoded_authorization?.user_id as string
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)

  const result = await boardsService.getBoards({ user_id, limit, page, keyword: req.query.keyword })

  return res.json({
    message: BOARDS_MESSAGES.GET_BOARDS_SUCCESS,
    result: {
      boards: result.boards,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    }
  })
}

export const getJoinedWorkspaceBoardsController = async (
  req: Request<ParamsDictionary, any, any, JoinedWorkspaceBoardQuery>,
  res: Response
) => {
  const { workspace_id } = req.params
  const user_id = req.decoded_authorization?.user_id as string
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)

  const result = await boardsService.getJoinedWorkspaceBoards({ workspace_id, user_id, limit, page })

  return res.json({
    message: BOARDS_MESSAGES.GET_JOINED_WORKSPACE_BOARDS_SUCCESS,
    result: {
      boards: result.boards,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    }
  })
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

export const leaveBoardController = async (req: Request<BoardParams>, res: Response) => {
  const { board_id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayload

  const result = await boardsService.leaveBoard(board_id, user_id)

  return res.json({ message: BOARDS_MESSAGES.LEAVE_BOARD_SUCCESS, result })
}
