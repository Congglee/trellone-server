import { ObjectId } from 'mongodb'
import { WorkspaceRole, WorkspaceType } from '~/constants/enums'
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
    const workspace = await databaseService.workspaces.findOneAndUpdate(
      { _id: new ObjectId(workspace_id) },
      {
        $set: body,
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return workspace
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
