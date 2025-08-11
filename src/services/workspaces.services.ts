import { ObjectId } from 'mongodb'
import { WorkspaceMemberAction, WorkspaceRole, WorkspaceType } from '~/constants/enums'
import { CreateWorkspaceReqBody, UpdateWorkspaceReqBody } from '~/models/requests/Workspace.requests'
import Workspace from '~/models/schemas/Workspace.schema'
import databaseService from '~/services/database.services'

class WorkspacesService {
  async createWorkspace(user_id: string, body: CreateWorkspaceReqBody) {
    const newWorkspace = new Workspace({
      title: body.title,
      description: body.description,
      type: WorkspaceType.Private,
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
                { $match: { _destroy: false } },
                {
                  $project: {
                    title: 1,
                    description: 1,
                    cover_photo: 1
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
    let updatedWorkspace = null

    if (body.member) {
      const { action, user_id, role, board_id } = body.member

      if (action === WorkspaceMemberAction.EditRole) {
        // Update the role of a specific member in the workspace
        updatedWorkspace = await databaseService.workspaces.findOneAndUpdate(
          {
            _id: new ObjectId(workspace_id),
            'members.user_id': new ObjectId(user_id)
          },
          {
            $set: { 'members.$.role': role },
            $currentDate: { updated_at: true }
          },
          { returnDocument: 'after' }
        )
      }

      if (action === WorkspaceMemberAction.Leave) {
        // Remove member from members array and add to guests array
        updatedWorkspace = await databaseService.workspaces.findOneAndUpdate(
          { _id: new ObjectId(workspace_id) },
          {
            $pull: { members: { user_id: new ObjectId(user_id) } },
            $addToSet: { guests: new ObjectId(user_id) },
            $currentDate: { updated_at: true }
          },
          { returnDocument: 'after' }
        )
      }

      if (action === WorkspaceMemberAction.RemoveFromWorkspace) {
        // Before removing from workspace, check if user is in any board members
        // If found, remove from all boards and add to workspace guests
        const userObjectId = new ObjectId(user_id)
        const workspaceObjectId = new ObjectId(workspace_id)

        // Find all boards in this workspace where the user is a member
        const boardsWithUser = await databaseService.boards
          .find({
            workspace_id: workspaceObjectId,
            _destroy: false,
            'members.user_id': userObjectId
          })
          .toArray()

        // If user is found in any board members, perform bulk operations
        if (boardsWithUser.length > 0) {
          // TODO: Maybe this will be implemented later in the future 🤔
          // Remove user from all board members arrays in parallel
          // const boardUpdatePromises = boardsWithUser.map((board) =>
          //   databaseService.boards.updateOne(
          //     { _id: board._id },
          //     {
          //       $pull: { members: { user_id: userObjectId } },
          //       $currentDate: { updated_at: true }
          //     }
          //   )
          // )

          // Execute all board updates in parallel
          // await Promise.all(boardUpdatePromises)

          // Update workspace: remove from members, add to guests (if not already present)
          updatedWorkspace = await databaseService.workspaces.findOneAndUpdate(
            { _id: workspaceObjectId },
            {
              $pull: { members: { user_id: userObjectId } },
              $addToSet: { guests: userObjectId },
              $currentDate: { updated_at: true }
            },
            { returnDocument: 'after' }
          )
        } else {
          // User is not in any board members, just remove from workspace members
          updatedWorkspace = await databaseService.workspaces.findOneAndUpdate(
            { _id: workspaceObjectId },
            {
              $pull: { members: { user_id: userObjectId } },
              $currentDate: { updated_at: true }
            },
            { returnDocument: 'after' }
          )
        }
      }

      if (action === WorkspaceMemberAction.RemoveFromBoard) {
        // Remove member from a specific board's members array
        if (board_id) {
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

          // Return the workspace document (unchanged for this action)
          updatedWorkspace = await databaseService.workspaces.findOne({ _id: new ObjectId(workspace_id) })
        }
      }
    } else {
      updatedWorkspace = await databaseService.workspaces.findOneAndUpdate(
        { _id: new ObjectId(workspace_id) },
        {
          $set: body,
          $currentDate: { updated_at: true }
        },
        { returnDocument: 'after' }
      )
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
}

const workspacesService = new WorkspacesService()

export default workspacesService
