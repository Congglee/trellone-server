import { BoardRole, WorkspaceRole } from '~/constants/enums'

export enum WorkspacePermission {
  ViewWorkspace = 'WORKSPACE__VIEW',
  CreateBoard = 'WORKSPACE__CREATE_BOARD',
  ManageWorkspace = 'WORKSPACE__MANAGE',
  ManageMembers = 'WORKSPACE__MANAGE_MEMBERS',
  ManageGuests = 'WORKSPACE__MANAGE_GUESTS',
  DeleteWorkspace = 'WORKSPACE__DELETE',
  JoinWorkspaceBoard = 'WORKSPACE__JOIN_BOARD'
}

export enum BoardPermission {
  ViewBoard = 'BOARD__VIEW',
  ManageBoard = 'BOARD__MANAGE',
  ManageMembers = 'BOARD__MANAGE_MEMBERS',
  CreateColumn = 'BOARD__CREATE_COLUMN',
  EditColumn = 'BOARD__EDIT_COLUMN',
  ReorderColumn = 'BOARD__REORDER_COLUMN',
  ReorderCardInTheSameColumn = 'BOARD__REORDER_CARD_IN_THE_SAME_COLUMN',
  MoveCardToDifferentColumn = 'BOARD__MOVE_CARD_TO_DIFFERENT_COLUMN',
  DeleteColumn = 'BOARD__DELETE_COLUMN',
  CreateCard = 'BOARD__CREATE_CARD',
  EditCard = 'BOARD__EDIT_CARD',
  DeleteCard = 'BOARD__DELETE_CARD',
  Comment = 'BOARD__COMMENT',
  Attach = 'BOARD__ATTACH',
  EditBoardInfo = 'BOARD__EDIT_INFO',
  ChangeCoverPhoto = 'BOARD__CHANGE_COVER',
  DeleteBoard = 'BOARD__DELETE'
}

export const WORKSPACE_ROLE_PERMISSIONS: Record<WorkspaceRole, WorkspacePermission[]> = {
  [WorkspaceRole.Admin]: [
    WorkspacePermission.ViewWorkspace,
    WorkspacePermission.CreateBoard,
    WorkspacePermission.ManageWorkspace,
    WorkspacePermission.ManageMembers,
    WorkspacePermission.ManageGuests,
    WorkspacePermission.DeleteWorkspace,
    WorkspacePermission.JoinWorkspaceBoard
  ],
  [WorkspaceRole.Normal]: [
    WorkspacePermission.ViewWorkspace,
    WorkspacePermission.CreateBoard,
    WorkspacePermission.JoinWorkspaceBoard
  ]
}

export const BOARD_ROLE_PERMISSIONS: Record<BoardRole, BoardPermission[]> = {
  [BoardRole.Admin]: [
    BoardPermission.ViewBoard,
    BoardPermission.ManageBoard,
    BoardPermission.ManageMembers,
    BoardPermission.ReorderColumn,
    BoardPermission.ReorderCardInTheSameColumn,
    BoardPermission.MoveCardToDifferentColumn,
    BoardPermission.CreateColumn,
    BoardPermission.EditColumn,
    BoardPermission.DeleteColumn,
    BoardPermission.CreateCard,
    BoardPermission.EditCard,
    BoardPermission.DeleteCard,
    BoardPermission.Comment,
    BoardPermission.Attach,
    BoardPermission.EditBoardInfo,
    BoardPermission.ChangeCoverPhoto,
    BoardPermission.DeleteBoard
  ],
  [BoardRole.Member]: [
    BoardPermission.ViewBoard,
    BoardPermission.CreateColumn,
    BoardPermission.EditColumn,
    BoardPermission.ReorderColumn,
    BoardPermission.ReorderCardInTheSameColumn,
    BoardPermission.MoveCardToDifferentColumn,
    BoardPermission.CreateCard,
    BoardPermission.EditCard,
    BoardPermission.Comment,
    BoardPermission.Attach,
    BoardPermission.EditBoardInfo,
    BoardPermission.ChangeCoverPhoto
  ],
  [BoardRole.Observer]: [BoardPermission.ViewBoard]
}
