import { ObjectId } from 'mongodb'
import { InvitationType } from '~/constants/enums'
import { BoardInvitation } from '~/models/Extensions'

interface InvitationSchema {
  _id?: ObjectId
  inviter_id: ObjectId
  invitee_id: ObjectId
  type: InvitationType
  board_invitation?: BoardInvitation
  invite_token?: string
  _destroy?: boolean
  created_at?: Date
  updated_at?: Date
}

export default class Invitation {
  _id?: ObjectId
  inviter_id: ObjectId
  invitee_id: ObjectId
  type: InvitationType
  board_invitation: BoardInvitation
  invite_token: string
  _destroy: boolean
  created_at?: Date
  updated_at?: Date

  constructor(invitation: InvitationSchema) {
    const date = new Date()

    this._id = invitation._id
    this.inviter_id = invitation.inviter_id
    this.invitee_id = invitation.invitee_id
    this.type = invitation.type || InvitationType.BoardInvitation
    this.board_invitation = invitation.board_invitation || ({} as BoardInvitation)
    this.invite_token = invitation.invite_token || ''
    this._destroy = invitation._destroy || false
    this.created_at = invitation.created_at || date
    this.updated_at = invitation.updated_at || date
  }
}
