import { ObjectId } from 'mongodb'
import { WorkspaceType } from '~/constants/enums'
import { WorkspaceMember } from '~/models/Extensions'

interface WorkspaceSchema {
  _id?: ObjectId
  title: string
  description?: string
  type: WorkspaceType
  logo?: string
  members?: WorkspaceMember[]
  guests?: ObjectId[]
  _destroy?: boolean
  created_at?: Date
  updated_at?: Date
}

export default class Workspace {
  _id?: ObjectId
  title: string
  description: string
  type: WorkspaceType
  logo: string
  members: WorkspaceMember[]
  guests: ObjectId[]
  _destroy: boolean
  created_at?: Date
  updated_at?: Date

  constructor(workspace: WorkspaceSchema) {
    const date = new Date()

    this._id = workspace._id
    this.title = workspace.title
    this.description = workspace.description || ''
    this.type = workspace.type || WorkspaceType.Public
    this.logo = workspace.logo || ''
    this.members = workspace.members || []
    this.guests = workspace.guests || []
    this._destroy = workspace._destroy || false
    this.created_at = workspace.created_at || date
    this.updated_at = workspace.updated_at || date
  }
}
