export enum BoardType {
  Public = 'Public',
  Private = 'Private'
}

export enum WorkspaceType {
  Public = 'Public',
  Private = 'Private'
}

export enum WorkspaceRole {
  Admin = 'Admin',
  Normal = 'Normal'
}

export enum BoardRole {
  Admin = 'Admin',
  Member = 'Member',
  Observer = 'Observer'
}

export enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken,
  InviteToken
}

export enum MediaType {
  Image,
  Document
}

export enum CardMemberAction {
  Add = 'ADD',
  Remove = 'REMOVE'
}

export enum InvitationType {
  BoardInvitation = 'BOARD_INVITATION',
  WorkspaceInvitation = 'WORKSPACE_INVITATION'
}

export enum WorkspaceInvitationStatus {
  Pending = 'PENDING',
  Accepted = 'ACCEPTED',
  Rejected = 'REJECTED'
}

export enum BoardInvitationStatus {
  Pending = 'PENDING',
  Accepted = 'ACCEPTED',
  Rejected = 'REJECTED'
}

export enum AttachmentType {
  File = 'FILE',
  Link = 'LINK'
}

export enum CardCommentReactionAction {
  Add = 'ADD',
  Remove = 'REMOVE'
}

export enum RoleLevel {
  Workspace = 'Workspace',
  Board = 'Board'
}

export enum WorkspaceMemberAction {
  EditRole = 'EDIT_ROLE',
  RemoveFromWorkspace = 'REMOVE_FROM_WORKSPACE',
  RemoveFromBoard = 'REMOVE_FROM_BOARD',
  Leave = 'LEAVE'
}

export enum WorkspaceGuestAction {
  AddToWorkspace = 'ADD_TO_WORKSPACE',
  RemoveFromWorkspace = 'REMOVE_FROM_WORKSPACE',
  RemoveFromBoard = 'REMOVE_FROM_BOARD'
}
