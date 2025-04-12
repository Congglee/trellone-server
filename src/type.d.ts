import { InviteTokenPayload } from '~/models/requests/Invitation.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import Board from '~/models/schemas/Board.schema'
import Card from '~/models/schemas/Card.schema'
import Column from '~/models/schemas/Column.schema'
import User from '~/models/schemas/User.schema'

declare module 'express' {
  interface Request {
    decoded_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
    decoded_email_verify_token?: TokenPayload
    decoded_forgot_password_token?: TokenPayload
    decoded_invite_token?: InviteTokenPayload

    user?: User
    board?: Board
    column?: Column
    card?: Card
    invitee?: User
  }
}
