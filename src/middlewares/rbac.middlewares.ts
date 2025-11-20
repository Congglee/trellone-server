import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import {
  AUTH_MESSAGES,
  BOARDS_MESSAGES,
  CARDS_MESSAGES,
  COLUMNS_MESSAGES,
  WORKSPACES_MESSAGES
} from '~/constants/messages'
import { BoardPermission, WorkspacePermission } from '~/constants/permissions'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import Board from '~/models/schemas/Board.schema'
import Card from '~/models/schemas/Card.schema'
import Column from '~/models/schemas/Column.schema'
import Workspace from '~/models/schemas/Workspace.schema'
import databaseService from '~/services/database.services'
import { wrapRequestHandler } from '~/utils/handlers'
import { hasBoardPermission, hasWorkspacePermission } from '~/utils/rbac'
import { assertBoardIsOpen, assertCardIsOpen } from '~/utils/guards'
import { BoardRole } from '~/constants/enums'
import { BOARD_ERROR_CODES } from '~/constants/error-codes'

export const requireWorkspacePermission = (permission: WorkspacePermission | WorkspacePermission[]) => {
  return wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
    const workspace = req.workspace as Workspace | undefined

    if (!workspace) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: WORKSPACES_MESSAGES.WORKSPACE_NOT_FOUND
      })
    }

    const { user_id } = req.decoded_authorization as TokenPayload

    const isWorkspaceMember = (workspace.members || []).some((member) => member.user_id.equals(new ObjectId(user_id)))

    if (!isWorkspaceMember) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: WORKSPACES_MESSAGES.USER_NOT_MEMBER_OF_WORKSPACE
      })
    }

    const allowed = (Array.isArray(permission) ? permission : [permission]).some((perm) =>
      hasWorkspacePermission(new ObjectId(user_id), workspace, perm)
    )

    if (!allowed) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: AUTH_MESSAGES.INSUFFICIENT_WORKSPACE_PERMISSIONS
      })
    }

    next()
  })
}

export const requireBoardPermission = (
  permission: BoardPermission | BoardPermission[],
  options?: { allowClosed?: boolean }
) => {
  return wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
    const board = req.board as Board | undefined

    if (!board) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: BOARDS_MESSAGES.BOARD_NOT_FOUND
      })
    }

    const { user_id } = req.decoded_authorization as TokenPayload

    const workspace = (board as { workspace?: Workspace }).workspace || null

    const requested = Array.isArray(permission) ? permission : [permission]
    const includesView = requested.includes(BoardPermission.ViewBoard)
    const includesDelete = requested.includes(BoardPermission.DeleteBoard)
    const allowClosed = options?.allowClosed ?? false

    if (includesDelete && !board._destroy) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: BOARDS_MESSAGES.BOARD_MUST_BE_CLOSED_BEFORE_DELETION
      })
    }

    if (!allowClosed && !includesView && !includesDelete) {
      assertBoardIsOpen(board)
    }

    // If board is closed, only Board Admins can view its details
    if (includesView && board._destroy) {
      const isAdmin = (board.members || []).some(
        (member) => member.user_id.equals(new ObjectId(user_id)) && member.role === BoardRole.Admin
      )

      if (!isAdmin) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.FORBIDDEN,
          message: `${board.title} has been closed. Please contact the board admin to reopen it.`,
          error_code: BOARD_ERROR_CODES.BOARD_ARCHIVED
        })
      }
    }

    const allowed = (Array.isArray(permission) ? permission : [permission]).some((perm) =>
      hasBoardPermission(new ObjectId(user_id), board, perm, workspace)
    )

    if (!allowed) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: AUTH_MESSAGES.INSUFFICIENT_BOARD_PERMISSIONS
      })
    }

    next()
  })
}

// Internal helper to retrieve board and its workspace context for RBAC checks
const getBoardContext = async (boardId: ObjectId) => {
  const board = await databaseService.boards.findOne({ _id: boardId })

  if (!board) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.NOT_FOUND,
      message: BOARDS_MESSAGES.BOARD_NOT_FOUND
    })
  }

  let workspace: Workspace | null = null

  if (board.workspace_id) {
    workspace = await databaseService.workspaces.findOne({ _id: board.workspace_id })
  }

  return { board, workspace }
}

export const requireBoardPermissionFromBody = (permission: BoardPermission, fieldName = 'board_id') => {
  return wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
    const boardId = (req.body as Record<string, string | undefined>)[fieldName]

    if (!boardId || !ObjectId.isValid(boardId)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: BOARDS_MESSAGES.INVALID_BOARD_ID
      })
    }

    const { board, workspace } = await getBoardContext(new ObjectId(boardId))

    const requested = Array.isArray(permission) ? permission : [permission]
    const includesView = requested.includes(BoardPermission.ViewBoard)

    if (!includesView) {
      assertBoardIsOpen(board)
    }

    const { user_id } = req.decoded_authorization as TokenPayload

    const isBoardMember = board.members?.some((member) => member.user_id.equals(new ObjectId(user_id)))

    if (!isBoardMember) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: BOARDS_MESSAGES.USER_NOT_MEMBER_OF_BOARD
      })
    }

    const allowed = (Array.isArray(permission) ? permission : [permission]).some((perm) =>
      hasBoardPermission(new ObjectId(user_id), board, perm, workspace)
    )

    if (!allowed) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: AUTH_MESSAGES.INSUFFICIENT_BOARD_PERMISSIONS
      })
    }

    next()
  })
}

export const requireColumnPermission = (permission: BoardPermission | BoardPermission[]) => {
  return wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
    const column = req.column as Column | undefined

    if (!column) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: COLUMNS_MESSAGES.COLUMN_NOT_FOUND
      })
    }

    const { board, workspace } = await getBoardContext(column.board_id)

    const requested = Array.isArray(permission) ? permission : [permission]
    const includesView = requested.includes(BoardPermission.ViewBoard)

    if (!includesView) {
      assertBoardIsOpen(board)
    }

    const { user_id } = req.decoded_authorization as TokenPayload

    const allowed = (Array.isArray(permission) ? permission : [permission]).some((perm) =>
      hasBoardPermission(new ObjectId(user_id), board, perm, workspace)
    )

    if (!allowed) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: AUTH_MESSAGES.INSUFFICIENT_BOARD_PERMISSIONS
      })
    }

    next()
  })
}

export const requireCardPermission = (
  permission: BoardPermission | BoardPermission[],
  options?: { allowClosed?: boolean }
) => {
  return wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
    const card = req.card as Card | undefined

    if (!card) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: CARDS_MESSAGES.CARD_NOT_FOUND
      })
    }

    const { board, workspace } = await getBoardContext(card.board_id)

    const requested = Array.isArray(permission) ? permission : [permission]
    const includesView = requested.includes(BoardPermission.ViewBoard)
    const includesDelete = requested.includes(BoardPermission.DeleteCard)
    const allowClosed = options?.allowClosed ?? false

    if (!includesView) {
      assertBoardIsOpen(board)
    }

    if (includesDelete && !card._destroy) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: CARDS_MESSAGES.CARD_MUST_BE_ARCHIVED_BEFORE_DELETION
      })
    }

    if (!allowClosed && !includesView && !includesDelete) {
      assertCardIsOpen(card as Card)
    }

    const { user_id } = req.decoded_authorization as TokenPayload

    const allowed = (Array.isArray(permission) ? permission : [permission]).some((perm) =>
      hasBoardPermission(new ObjectId(user_id), board, perm, workspace)
    )

    if (!allowed) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: AUTH_MESSAGES.INSUFFICIENT_BOARD_PERMISSIONS
      })
    }

    next()
  })
}

export const requireCardPermissionFromBody = (
  permission: BoardPermission | BoardPermission[],
  fieldName = 'current_card_id',
  options?: { allowClosed?: boolean }
) => {
  return wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
    const cardId = (req.body as Record<string, string | undefined>)[fieldName]

    if (!cardId || !ObjectId.isValid(cardId)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: CARDS_MESSAGES.INVALID_CARD_ID
      })
    }

    const card = await databaseService.cards.findOne({ _id: new ObjectId(cardId) })

    if (!card) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: CARDS_MESSAGES.CARD_NOT_FOUND
      })
    }

    const { board, workspace } = await getBoardContext(card.board_id)

    const requested = Array.isArray(permission) ? permission : [permission]
    const includesView = requested.includes(BoardPermission.ViewBoard)
    const includesDelete = requested.includes(BoardPermission.DeleteCard)
    const allowClosed = options?.allowClosed ?? false

    if (!includesView) {
      assertBoardIsOpen(board)
    }

    if (includesDelete && !card._destroy) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: CARDS_MESSAGES.CARD_MUST_BE_ARCHIVED_BEFORE_DELETION
      })
    }

    if (!allowClosed && !includesView && !includesDelete) {
      assertCardIsOpen(card as Card)
    }

    const { user_id } = req.decoded_authorization as TokenPayload

    const allowed = (Array.isArray(permission) ? permission : [permission]).some((perm) =>
      hasBoardPermission(new ObjectId(user_id), board, perm, workspace)
    )

    if (!allowed) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: AUTH_MESSAGES.INSUFFICIENT_BOARD_PERMISSIONS
      })
    }

    next()
  })
}
