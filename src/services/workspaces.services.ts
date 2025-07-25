import { ObjectId } from 'mongodb'
import { WorkspaceRole, WorkspaceType } from '~/constants/enums'
import { CreateWorkspaceReqBody } from '~/models/requests/Workspace.requests'
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
}

const workspacesService = new WorkspacesService()

export default workspacesService
