export enum BoardType {
  Public = 'public',
  Private = 'private'
}

export enum Role {
  Client = 'client',
  Admin = 'admin'
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
  EmailVerifyToken
}

export enum MediaType {
  Image
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
