import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/environment'
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

  async getInvitations({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const queryConditions = [{ invitee_id: new ObjectId(user_id) }, { _destroy: false }]

    const [invitations, total] = await Promise.all([
      await databaseService.invitations
        .aggregate([
          { $match: { $and: queryConditions } },
          {
            $lookup: {
              from: envConfig.dbUsersCollection,
              localField: 'inviter_id',
              foreignField: '_id',
              as: 'inviter',
              pipeline: [
                {
                  $project: {
                    password: 0,
                    email_verify_token: 0,
                    forgot_password_token: 0
                  }
                }
              ]
            }
          },
          { $unwind: '$inviter' },
          {
            $lookup: {
              from: envConfig.dbUsersCollection,
              localField: 'invitee_id',
              foreignField: '_id',
              as: 'invitee',
              pipeline: [
                {
                  $project: {
                    password: 0,
                    email_verify_token: 0,
                    forgot_password_token: 0
                  }
                }
              ]
            }
          },
          { $unwind: '$invitee' },
          {
            $lookup: {
              from: envConfig.dbBoardsCollection,
              localField: 'board_invitation.board_id',
              foreignField: '_id',
              as: 'board'
            }
          },
          { $unwind: '$board' },
          { $sort: { created_at: -1 } },
          { $skip: limit * (page - 1) },
          { $limit: limit }
        ])
        .toArray(),
      await databaseService.invitations.countDocuments({
        $and: queryConditions
      })
    ])

    return { invitations, total }
  }
}

const invitationsService = new InvitationsService()

export default invitationsService
