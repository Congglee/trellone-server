export enum BoardType {
  Public = 'Public',
  Private = 'Private'
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
  BoardInvitation = 'BOARD_INVITATION'
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

export enum CardAttachmentAction {
  Add = 'ADD',
  Edit = 'EDIT',
  Remove = 'REMOVE'
}

export enum CardCommentAction {
  Add = 'ADD',
  Edit = 'EDIT',
  Remove = 'REMOVE'
}

export enum CardCommentReactionAction {
  Add = 'ADD',
  Remove = 'REMOVE'
}
