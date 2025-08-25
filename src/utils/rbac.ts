import { ObjectId } from 'mongodb'
import {
  BoardPermission,
  BOARD_ROLE_PERMISSIONS,
  WorkspacePermission,
  WORKSPACE_ROLE_PERMISSIONS
} from '~/constants/permissions'
import { BoardRole, WorkspaceRole } from '~/constants/enums'
import Workspace from '~/models/schemas/Workspace.schema'
import Board from '~/models/schemas/Board.schema'

const RESPECT_BOARD_EXPLICIT_OVERRIDES = true

export type EffectiveBoardRole = BoardRole | null

export const getWorkspaceActor = (workspace: Workspace, userId: ObjectId) => {
  const member = (workspace.members || []).find((m) => m.user_id.equals(userId))

  if (member) {
    return { role: member.role, isGuest: false }
  }

  const isGuest = (workspace.guests || []).some((g) => g.equals(userId))

  return { role: null, isGuest }
}

export const getExplicitBoardRole = (board: Board, userId: ObjectId) => {
  const member = (board.members || []).find((m) => m.user_id.equals(userId))
  return member ? member.role : null
}

export const resolveEffectiveBoardRole = (board: Board, workspace: Workspace | null, userId: ObjectId) => {
  const explicit = getExplicitBoardRole(board, userId)

  if (RESPECT_BOARD_EXPLICIT_OVERRIDES && explicit) {
    return explicit
  }

  if (!workspace) {
    return explicit
  }

  const { role: workspaceRole } = getWorkspaceActor(workspace, userId)

  if (!workspaceRole) {
    return explicit
  }

  // Inheritance when no explicit role
  if (!explicit) {
    if (workspaceRole === WorkspaceRole.Admin) {
      return BoardRole.Admin
    }

    if (workspaceRole === WorkspaceRole.Normal) {
      return BoardRole.Member
    }
  }

  return explicit
}

export const hasWorkspacePermission = (userId: ObjectId, workspace: Workspace, permission: WorkspacePermission) => {
  const { role } = getWorkspaceActor(workspace, userId)

  if (!role) {
    return false
  }

  const perms = WORKSPACE_ROLE_PERMISSIONS[role] || []

  return perms.includes(permission)
}

export const hasBoardPermission = (
  userId: ObjectId,
  board: Board,
  permission: BoardPermission,
  workspace: Workspace | null
) => {
  const role = resolveEffectiveBoardRole(board, workspace, userId)

  if (!role) {
    return false
  }

  const perms = BOARD_ROLE_PERMISSIONS[role] || []

  return perms.includes(permission)
}
