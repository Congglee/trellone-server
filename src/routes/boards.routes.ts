import { Router } from 'express'
import {
  createBoardController,
  deleteBoardController,
  editBoardMemberRoleController,
  getBoardController,
  getBoardsController,
  getJoinedWorkspaceBoardsController,
  leaveBoardController,
  updateBoardController
} from '~/controllers/boards.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import {
  boardIdValidator,
  boardMemberIdValidator,
  boardWorkspaceIdValidator,
  createBoardValidator,
  editBoardMemberRoleValidator,
  getBoardsValidator,
  leaveBoardValidator,
  rejectIfBoardClosed,
  requireBoardMembership,
  updateBoardValidator
} from '~/middlewares/boards.middlewares'
import { filterMiddleware, paginationValidator } from '~/middlewares/common.middlewares'
import { verifiedUserValidator } from '~/middlewares/users.middlewares'
import { UpdateBoardReqBody } from '~/models/requests/Board.requests'
import { wrapRequestHandler } from '~/utils/handlers'
import { requireBoardPermission } from '~/middlewares/rbac.middlewares'
import { BoardPermission } from '~/constants/permissions'

const boardsRouter = Router()

boardsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createBoardValidator,
  wrapRequestHandler(createBoardController)
)

boardsRouter.get(
  '/',
  accessTokenValidator,
  paginationValidator,
  getBoardsValidator,
  wrapRequestHandler(getBoardsController)
)

boardsRouter.get(
  '/workspace/:workspace_id',
  accessTokenValidator,
  paginationValidator,
  boardWorkspaceIdValidator,
  wrapRequestHandler(getJoinedWorkspaceBoardsController)
)

boardsRouter.get(
  '/:board_id',
  accessTokenValidator,
  verifiedUserValidator,
  boardIdValidator,
  requireBoardPermission(BoardPermission.ViewBoard),
  wrapRequestHandler(getBoardController)
)

boardsRouter.put(
  '/:board_id',
  accessTokenValidator,
  verifiedUserValidator,
  boardIdValidator,
  rejectIfBoardClosed,
  requireBoardMembership,
  updateBoardValidator,
  filterMiddleware<UpdateBoardReqBody>([
    'title',
    'description',
    'visibility',
    'workspace_id',
    'column_order_ids',
    'cover_photo',
    'background_color',
    '_destroy'
  ]),
  requireBoardPermission([
    BoardPermission.ManageBoard,
    BoardPermission.EditBoardInfo,
    BoardPermission.ChangeBoardBackground,
    BoardPermission.ReorderColumn
  ]),
  wrapRequestHandler(updateBoardController)
)

boardsRouter.post(
  '/:board_id/members/me/leave',
  accessTokenValidator,
  verifiedUserValidator,
  boardIdValidator,
  requireBoardMembership,
  leaveBoardValidator,
  wrapRequestHandler(leaveBoardController)
)

boardsRouter.delete(
  '/:board_id',
  accessTokenValidator,
  verifiedUserValidator,
  boardIdValidator,
  requireBoardMembership,
  requireBoardPermission(BoardPermission.DeleteBoard),
  wrapRequestHandler(deleteBoardController)
)

boardsRouter.put(
  '/:board_id/members/:user_id/role',
  accessTokenValidator,
  verifiedUserValidator,
  boardIdValidator,
  boardMemberIdValidator,
  editBoardMemberRoleValidator,
  requireBoardPermission(BoardPermission.ManageMembers),
  wrapRequestHandler(editBoardMemberRoleController)
)

export default boardsRouter
