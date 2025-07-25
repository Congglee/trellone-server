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
    const queryConditions: any[] = [{ 'members.user_id': new ObjectId(user_id) }, { _destroy: false }]

    const [workspaces, total] = await Promise.all([
      databaseService.workspaces
        .aggregate<Workspace>([
          { $match: { $and: queryConditions } },
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
}

const workspacesService = new WorkspacesService()

export default workspacesService
