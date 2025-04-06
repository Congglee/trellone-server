import { ObjectId } from 'mongodb'
import { BoardInvitationStatus, InvitationType } from '~/constants/enums'
import { CreateNewBoardInvitationReqBody } from '~/models/requests/Invitation.requests'
import Invitation from '~/models/schemas/Invitation.schema'
import databaseService from '~/services/database.services'

class InvitationsService {
  async createNewBoardInvitation(body: CreateNewBoardInvitationReqBody, inviter_id: string) {
    const invitee = await databaseService.users.findOne({ email: body.invitee_email })

    const payload = {
      inviter_id: new ObjectId(inviter_id),
      invitee_id: new ObjectId(invitee?._id),
      type: InvitationType.BoardInvitation,
      board_invitation: {
        board_id: new ObjectId(body.board_id),
        status: BoardInvitationStatus.Pending
      }
    }

    const result = await databaseService.invitations.insertOne(new Invitation(payload))

    const invitation = await databaseService.invitations.findOne({ _id: result.insertedId })

    return invitation
  }
}

const invitationsService = new InvitationsService()

export default invitationsService
