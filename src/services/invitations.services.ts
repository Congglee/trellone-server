import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/environment'
import { BoardInvitationStatus, InvitationType, TokenType } from '~/constants/enums'
import { BoardInvitation } from '~/models/Extensions'
import { CreateNewBoardInvitationReqBody } from '~/models/requests/Invitation.requests'
import Board from '~/models/schemas/Board.schema'
import Invitation from '~/models/schemas/Invitation.schema'
import User from '~/models/schemas/User.schema'
import { sendBoardInvitationEmail } from '~/providers/resend'
import databaseService from '~/services/database.services'
import { signToken } from '~/utils/jwt'

class InvitationsService {
  private signInvitationToken({ inviter_id, invitation_id }: { inviter_id: string; invitation_id: string }) {
    return signToken({
      payload: { token_type: TokenType.InviteToken, inviter_id, invitation_id },
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
    const invitation_id = new ObjectId()

    const invite_token = await this.signInvitationToken({
      inviter_id,
      invitation_id: invitation_id.toString()
    })

    const inviter = (await databaseService.users.findOne({ _id: new ObjectId(inviter_id) })) as User

    const payload = {
      inviter_id: new ObjectId(inviter_id),
      invitee_id: new ObjectId(invitee._id),
      type: InvitationType.BoardInvitation,
      board_invitation: {
        board_id: new ObjectId(body.board_id),
        status: BoardInvitationStatus.Pending
      },
      invite_token
    }

    const result = await databaseService.invitations.insertOne(
      new Invitation({
        ...payload,
        _id: invitation_id
      })
    )

    const invitation = await databaseService.invitations.findOne(
      { _id: result.insertedId },
      { projection: { invite_token: 0 } }
    )

    await sendBoardInvitationEmail({
      toAddress: invitee.email,
      invite_token,
      boardTitle: board.title,
      boardId: body.board_id,
      inviterName: inviter.display_name
    })

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

  async updateBoardInvitation(invitation_id: string, user_id: string, body: BoardInvitation) {
    const payload = { ...body, board_id: new ObjectId(body.board_id) }

    // Step 1: Update status in the Invitation document
    const invitation = await databaseService.invitations.findOneAndUpdate(
      { _id: new ObjectId(invitation_id), invitee_id: new ObjectId(user_id) },
      {
        $set: { board_invitation: payload },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    // Step 2: If the case is a successful invitation, it is necessary to add more information of the user (UserID) to the memberIds record in the Collection Board.
    if (body.status === BoardInvitationStatus.Accepted) {
      await databaseService.boards.findOneAndUpdate(
        { _id: new ObjectId(body.board_id) },
        { $push: { members: new ObjectId(user_id) } },
        { returnDocument: 'after' }
      )
    }

    return invitation
  }
}

const invitationsService = new InvitationsService()

export default invitationsService
