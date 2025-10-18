import { ObjectId } from 'mongodb'
import { BoardRole, WorkspaceRole, WorkspaceType } from '~/constants/enums'
import {
  CreateWorkspaceReqBody,
  EditWorkspaceMemberRoleReqBody,
  UpdateWorkspaceReqBody
} from '~/models/requests/Workspace.requests'
import Workspace from '~/models/schemas/Workspace.schema'
import databaseService from '~/services/database.services'

class WorkspacesService {
  async createWorkspace(user_id: string, body: CreateWorkspaceReqBody) {
    const newWorkspace = new Workspace({
      title: body.title,
      description: body.description,
      type: WorkspaceType.Public,
      members: [
        {
          user_id: new ObjectId(user_id),
          role: WorkspaceRole.Admin,
          joined_at: new Date()
        }
      ]
    })

    const result = await databaseService.workspaces.insertOne(newWorkspace)

    const workspace = await databaseService.workspaces.findOne({ _id: result.insertedId })

    return workspace
  }

  async getWorkspaces({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const queryConditions = [
      {
        $or: [
          {
            members: {
              $elemMatch: { user_id: new ObjectId(user_id) }
            }
          },
          { guests: new ObjectId(user_id) }
        ]
      },
      { _destroy: false }
    ]

    const [workspaces, total] = await Promise.all([
      databaseService.workspaces
        .aggregate<Workspace>([
          { $match: { $and: queryConditions } },
          {
            $lookup: {
              from: 'boards',
              localField: '_id',
              foreignField: 'workspace_id',
              as: 'boards',
              pipeline: [
                { $match: { 'members.user_id': new ObjectId(user_id) } },
                {
                  $project: {
                    title: 1,
                    description: 1,
                    cover_photo: 1,
                    background_color: 1,
                    _destroy: 1
                  }
                }
              ]
            }
          },
          { $sort: { created_at: -1 } },
          { $skip: limit * (page - 1) },
          { $limit: limit }
        ])
        .toArray(),
      databaseService.workspaces.countDocuments({ $and: queryConditions })
    ])

    return { workspaces, total }
  }

  async updateWorkspace(workspace_id: string, body: UpdateWorkspaceReqBody) {
    const workspace = await databaseService.workspaces.findOneAndUpdate(
      { _id: new ObjectId(workspace_id) },
      {
        $set: body,
        $currentDate: { updated_at: true }
      },
      {
        returnDocument: 'after'
      }
    )

    return workspace
  }

  async editWorkspaceMemberRole(workspace_id: string, user_id: string, body: EditWorkspaceMemberRoleReqBody) {
    const workspace = await databaseService.workspaces.findOneAndUpdate(
      {
        _id: new ObjectId(workspace_id),
        'members.user_id': new ObjectId(user_id)
      },
      {
        $set: { 'members.$.role': body.role },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return workspace
  }

  async leaveWorkspace(workspace_id: string, user_id: string) {
    // Check if the user is a member of any board within this workspace
    const boardsCount = await databaseService.boards.countDocuments({
      workspace_id: new ObjectId(workspace_id),
      _destroy: false,
      'members.user_id': new ObjectId(user_id)
    })

    // If the user is a member of at least one board: move them from members to guests
    // Otherwise: remove them entirely from the workspace (both members and guests)
    if (boardsCount > 0) {
      const workspace = await databaseService.workspaces.findOneAndUpdate(
        { _id: new ObjectId(workspace_id) },
        {
          $pull: { members: { user_id: new ObjectId(user_id) } },
          $addToSet: { guests: new ObjectId(user_id) },
          $currentDate: { updated_at: true }
        },
        { returnDocument: 'after' }
      )

      return workspace
    }

    const workspace = await databaseService.workspaces.findOneAndUpdate(
      { _id: new ObjectId(workspace_id) },
      {
        $pull: {
          members: { user_id: new ObjectId(user_id) },
          guests: new ObjectId(user_id)
        },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return workspace
  }

  async removeWorkspaceMember(workspace_id: string, user_id: string) {
    // Find all boards in this workspace where the user is a member
    const boardsWithUser = await databaseService.boards
      .find({
        workspace_id: new ObjectId(workspace_id),
        _destroy: false,
        'members.user_id': new ObjectId(user_id)
      })
      .toArray()

    let updatedWorkspace = null

    // If user is found in any board members, perform bulk operations
    if (boardsWithUser.length > 0) {
      // Update workspace: remove from members, add to guests (if not already present)
      updatedWorkspace = await databaseService.workspaces.findOneAndUpdate(
        { _id: new ObjectId(workspace_id) },
        {
          $pull: { members: { user_id: new ObjectId(user_id) } },
          $addToSet: { guests: new ObjectId(user_id) },
          $currentDate: { updated_at: true }
        },
        { returnDocument: 'after' }
      )
    } else {
      // User is not in any board members, just remove from workspace members
      updatedWorkspace = await databaseService.workspaces.findOneAndUpdate(
        { _id: new ObjectId(workspace_id) },
        {
          $pull: { members: { user_id: new ObjectId(user_id) } },
          $currentDate: { updated_at: true }
        },
        { returnDocument: 'after' }
      )
    }

    return updatedWorkspace
  }

  async removeWorkspaceMemberFromBoard(workspace_id: string, board_id: string, user_id: string) {
    // Remove member from a specific board's members array
    await databaseService.boards.updateOne(
      {
        _id: new ObjectId(board_id),
        workspace_id: new ObjectId(workspace_id)
      },
      {
        $pull: { members: { user_id: new ObjectId(user_id) } },
        $currentDate: { updated_at: true }
      }
    )

    // Check how many other boards in this workspace the member is still a member of
    const remainingBoardsCount = await databaseService.boards.countDocuments({
      workspace_id: new ObjectId(workspace_id),
      _destroy: false,
      'members.user_id': new ObjectId(user_id),
      _id: { $ne: new ObjectId(board_id) } // Exclude the board we just removed them from
    })

    let updatedWorkspace = null

    if (remainingBoardsCount === 0) {
      // If member is not a member of any other boards in the workspace, remove from workspace members
      updatedWorkspace = await databaseService.workspaces.findOneAndUpdate(
        { _id: new ObjectId(workspace_id) },
        {
          $pull: { members: { user_id: new ObjectId(user_id) } },
          $currentDate: { updated_at: true }
        },
        { returnDocument: 'after' }
      )
    } else {
      // Member is still a member of other boards, return workspace unchanged
      updatedWorkspace = await databaseService.workspaces.findOne({ _id: new ObjectId(workspace_id) })
    }

    return updatedWorkspace
  }

  async addGuestToWorkspace(workspace_id: string, user_id: string) {
    const workspace = await databaseService.workspaces.findOneAndUpdate(
      { _id: new ObjectId(workspace_id) },
      {
        $addToSet: {
          members: {
            user_id: new ObjectId(user_id),
            role: WorkspaceRole.Normal,
            joined_at: new Date()
          }
        },
        $pull: { guests: new ObjectId(user_id) },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return workspace
  }

  async removeGuestFromWorkspace(workspace_id: string, user_id: string) {
    const affected_board_ids = await databaseService.boards
      .find(
        {
          workspace_id: new ObjectId(workspace_id),
          _destroy: false,
          'members.user_id': new ObjectId(user_id)
        },
        { projection: { _id: 1 } }
      )
      .map((board) => board._id.toString())
      .toArray()

    // Remove guest from workspace guests array and from all boards within the workspace
    await databaseService.boards.updateMany(
      {
        workspace_id: new ObjectId(workspace_id),
        _destroy: false,
        'members.user_id': new ObjectId(user_id)
      },
      {
        $pull: { members: { user_id: new ObjectId(user_id) } },
        $currentDate: { updated_at: true }
      }
    )

    const workspace = await databaseService.workspaces.findOneAndUpdate(
      { _id: new ObjectId(workspace_id) },
      {
        $pull: { guests: new ObjectId(user_id) },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return { workspace, affected_board_ids }
  }

  async removeGuestFromBoard(workspace_id: string, board_id: string, user_id: string) {
    // Remove user from the specified board's members array
    await databaseService.boards.updateOne(
      {
        _id: new ObjectId(board_id),
        workspace_id: new ObjectId(workspace_id)
      },
      {
        $pull: { members: { user_id: new ObjectId(user_id) } },
        $currentDate: { updated_at: true }
      }
    )

    // Check how many other boards in this workspace the guest is still a member of
    const remainingBoardsCount = await databaseService.boards.countDocuments({
      workspace_id: new ObjectId(workspace_id),
      _destroy: false,
      'members.user_id': new ObjectId(user_id),
      _id: { $ne: new ObjectId(board_id) } // Exclude the board we just removed them from
    })

    let updatedWorkspace = null

    // If guest is not a member of any other boards in the workspace, remove from workspace guests
    if (remainingBoardsCount === 0) {
      updatedWorkspace = await databaseService.workspaces.findOneAndUpdate(
        { _id: new ObjectId(workspace_id) },
        {
          $pull: { guests: new ObjectId(user_id) },
          $currentDate: { updated_at: true }
        },
        { returnDocument: 'after' }
      )
    } else {
      // Guest is still a member of other boards, return workspace unchanged
      updatedWorkspace = await databaseService.workspaces.findOne({ _id: new ObjectId(workspace_id) })
    }

    return updatedWorkspace
  }

  async deleteWorkspace(workspace_id: string) {
    // Delete the workspace
    await databaseService.workspaces.deleteOne({ _id: new ObjectId(workspace_id) })

    // Move all Boards in that Workspace to the `closed` state (i.e., set `_destroy` to `true`) and set `workspace_id` to `null`.
    await databaseService.boards.updateMany(
      { workspace_id: new ObjectId(workspace_id) },
      {
        $set: { _destroy: true, workspace_id: null },
        $currentDate: { updated_at: true }
      }
    )
  }

  async joinWorkspaceBoard(board_id: string, user_id: string) {
    const board = await databaseService.boards.findOneAndUpdate(
      { _id: new ObjectId(board_id) },
      {
        $push: {
          members: {
            user_id: new ObjectId(user_id),
            role: BoardRole.Member,
            joined_at: new Date()
          }
        },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return board
  }
}

const workspacesService = new WorkspacesService()

export default workspacesService
