import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/environment'
import { BoardInvitationStatus, InvitationType } from '~/constants/enums'
import { CreateNewBoardInvitationReqBody } from '~/models/requests/Invitation.requests'
import Board from '~/models/schemas/Board.schema'
import Invitation from '~/models/schemas/Invitation.schema'
import User from '~/models/schemas/User.schema'
import { sendBoardInvitationEmail } from '~/providers/resend'
import databaseService from '~/services/database.services'
import { signToken } from '~/utils/jwt'

class InvitationsService {
  private signInvitationToken({ user_id, board_id }: { user_id: string; board_id: string }) {
    return signToken({
      payload: { user_id, board_id },
      privateKey: envConfig.jwtSecretInviteToken as string,
      options: { expiresIn: envConfig.inviteTokenExpiresIn }
    })
  }

  async createNewBoardInvitation(
    body: CreateNewBoardInvitationReqBody,
    inviter_id: string,
    invitee: User,
    board: Board
  ) {
    const invite_token = await this.signInvitationToken({ user_id: inviter_id, board_id: body.board_id })

    const inviter = (await databaseService.users.findOne({ _id: new ObjectId(inviter_id) })) as User

    const payload = {
      inviter_id: new ObjectId(inviter_id),
      invitee_id: new ObjectId(invitee._id),
      type: InvitationType.BoardInvitation,
      board_invitation: {
        board_id: new ObjectId(body.board_id),
        status: BoardInvitationStatus.Pending
      }
    }

    const result = await databaseService.invitations.insertOne(new Invitation(payload))

    const invitation = await databaseService.invitations.findOne({ _id: result.insertedId })

    await sendBoardInvitationEmail(invitee.email, invite_token, board.title, inviter.display_name)

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
