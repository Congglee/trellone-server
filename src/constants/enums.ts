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
