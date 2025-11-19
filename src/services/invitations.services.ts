import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/environment'
import {
  BoardInvitationStatus,
  InvitationType,
  TokenType,
  WorkspaceInvitationStatus,
  WorkspaceRole
} from '~/constants/enums'
import { BoardInvitation, WorkspaceInvitation } from '~/models/Extensions'
import {
  CreateNewBoardInvitationReqBody,
  CreateNewWorkspaceInvitationReqBody
} from '~/models/requests/Invitation.requests'
import Board from '~/models/schemas/Board.schema'
import Invitation from '~/models/schemas/Invitation.schema'
import User from '~/models/schemas/User.schema'
import Workspace from '~/models/schemas/Workspace.schema'
import { sendBoardInvitationEmail, sendWorkspaceInvitationEmail } from '~/providers/resend'
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

  async createNewWorkspaceInvitation(
    body: CreateNewWorkspaceInvitationReqBody,
    inviter_id: string,
    invitee: User,
    workspace: Workspace
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
      type: InvitationType.WorkspaceInvitation,
      workspace_invitation: {
        workspace_id: new ObjectId(body.workspace_id),
        role: body.role,
        status: WorkspaceInvitationStatus.Pending
      },
      invite_token
    }

    const result = await databaseService.invitations.insertOne(
      new Invitation({
        ...payload,
        _id: invitation_id
      })
    )

    const [invitation] = await databaseService.invitations
      .aggregate<Invitation>([
        { $match: { _id: result.insertedId } },
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
                  forgot_password_token: 0,
                  google_id: 0
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
                  forgot_password_token: 0,
                  google_id: 0
                }
              }
            ]
          }
        },
        { $unwind: '$invitee' },
        {
          $lookup: {
            from: envConfig.dbWorkspacesCollection,
            localField: 'workspace_invitation.workspace_id',
            foreignField: '_id',
            as: 'workspace'
          }
        },
        { $unwind: '$workspace' }
      ])
      .toArray()

    await sendWorkspaceInvitationEmail({
      toAddress: invitee.email,
      invite_token,
      workspaceTitle: workspace.title,
      workspaceId: body.workspace_id,
      inviterName: inviter.display_name
    })

    return invitation
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
        workspace_id: new ObjectId(body.workspace_id),
        role: body.role,
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

    const [invitation] = await databaseService.invitations
      .aggregate<Invitation>([
        { $match: { _id: result.insertedId } },
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
                  forgot_password_token: 0,
                  google_id: 0
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
                  forgot_password_token: 0,
                  google_id: 0
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
        { $unwind: '$board' }
      ])
      .toArray()

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
          { $unwind: { path: '$board', preserveNullAndEmptyArrays: true } },
          {
            $lookup: {
              from: envConfig.dbWorkspacesCollection,
              localField: 'workspace_invitation.workspace_id',
              foreignField: '_id',
              as: 'workspace'
            }
          },
          { $unwind: { path: '$workspace', preserveNullAndEmptyArrays: true } },
          // Keep only invitations that still reference existing entities
          {
            $match: {
              $or: [
                {
                  $and: [{ board_invitation: { $exists: true } }, { board: { $ne: null } }]
                },
                {
                  $and: [{ workspace_invitation: { $exists: true } }, { workspace: { $ne: null } }]
                }
              ]
            }
          },
          { $sort: { created_at: -1 } },
          { $skip: limit * (page - 1) },
          { $limit: limit }
        ])
        .toArray(),
      // Count only the valid invitations according to the same filtering logic above
      (async () => {
        const counts = await databaseService.invitations
          .aggregate([
            { $match: { $and: queryConditions } },
            {
              $lookup: {
                from: envConfig.dbBoardsCollection,
                localField: 'board_invitation.board_id',
                foreignField: '_id',
                as: 'board'
              }
            },
            { $unwind: { path: '$board', preserveNullAndEmptyArrays: true } },
            {
              $lookup: {
                from: envConfig.dbWorkspacesCollection,
                localField: 'workspace_invitation.workspace_id',
                foreignField: '_id',
                as: 'workspace'
              }
            },
            { $unwind: { path: '$workspace', preserveNullAndEmptyArrays: true } },
            {
              $match: {
                $or: [
                  {
                    $and: [{ board_invitation: { $exists: true } }, { board: { $ne: null } }]
                  },
                  {
                    $and: [{ workspace_invitation: { $exists: true } }, { workspace: { $ne: null } }]
                  }
                ]
              }
            },
            { $count: 'total' }
          ])
          .toArray()

        return counts[0]?.total || 0
      })()
    ])

    return { invitations, total }
  }

  async updateWorkspaceInvitation(invitation_id: string, invitee_id: string, body: WorkspaceInvitation) {
    const payload = { ...body, workspace_id: new ObjectId(body.workspace_id) }
    let invitee = null

    // Step 1: Update the status in the Invitation document
    const invitation = await databaseService.invitations.findOneAndUpdate(
      { _id: new ObjectId(invitation_id), invitee_id: new ObjectId(invitee_id) },
      {
        $set: { workspace_invitation: payload },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    // Step 2: If the case is a successful invitation, it is necessary to add more information of the user (UserID) to the member_ids record in the Workspace collection.
    if (body.status === WorkspaceInvitationStatus.Accepted) {
      // Step 3: Atomically remove user from guests array (if present) and add to members array
      await databaseService.workspaces.findOneAndUpdate(
        { _id: new ObjectId(body.workspace_id) },
        {
          $pull: {
            guests: new ObjectId(invitee_id)
          },
          $push: {
            members: {
              user_id: new ObjectId(invitee_id),
              role: WorkspaceRole.Normal,
              joined_at: new Date(),
              invited_by: new ObjectId(invitation?.inviter_id)
            }
          }
        },
        { returnDocument: 'after' }
      )

      invitee = await databaseService.users.findOne(
        { _id: new ObjectId(invitee_id) },
        { projection: { password: 0, email_verify_token: 0, forgot_password_token: 0, google_id: 0 } }
      )
    }

    return { invitation, invitee }
  }

  async updateBoardInvitation(invitation_id: string, invitee_id: string, body: BoardInvitation) {
    const payload = { ...body, board_id: new ObjectId(body.board_id) }
    let invitee = null

    // Step 1: Update the status in the Invitation document
    const invitation = await databaseService.invitations.findOneAndUpdate(
      { _id: new ObjectId(invitation_id), invitee_id: new ObjectId(invitee_id) },
      {
        $set: { board_invitation: payload },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    // Step 2: If the case is a successful invitation, it is necessary to add more information of the user (UserID) to the `members` array in the Board collection.
    if (body.status === BoardInvitationStatus.Accepted) {
      await databaseService.boards.findOneAndUpdate(
        { _id: new ObjectId(body.board_id) },
        {
          $push: {
            members: {
              user_id: new ObjectId(invitee_id),
              role: body.role,
              joined_at: new Date(),
              invited_by: new ObjectId(invitation?.inviter_id)
            }
          }
        },
        { returnDocument: 'after' }
      )

      // Step 3: Workspace guest management - Add user to workspace guests if not already a member
      // First, retrieve the board to get its workspace_id
      const board = await databaseService.boards.findOne({ _id: new ObjectId(body.board_id) })

      if (board?.workspace_id) {
        // Check if the user is already a member of the workspace
        const isWorkspaceMember = await databaseService.workspaces.countDocuments({
          _id: board.workspace_id,
          members: { $elemMatch: { user_id: new ObjectId(invitee_id) } }
        })

        // If user is not a workspace member, add them to the guests array
        if (!isWorkspaceMember) {
          await databaseService.workspaces.findOneAndUpdate(
            { _id: board.workspace_id },
            {
              $addToSet: { guests: new ObjectId(invitee_id) }
            },
            { returnDocument: 'after' }
          )
        }
      }

      invitee = await databaseService.users.findOne(
        { _id: new ObjectId(invitee_id) },
        { projection: { password: 0, email_verify_token: 0, forgot_password_token: 0, google_id: 0 } }
      )
    }

    return { invitation, invitee }
  }
}

const invitationsService = new InvitationsService()

export default invitationsService
