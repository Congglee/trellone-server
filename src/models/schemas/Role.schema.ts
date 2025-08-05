import { ObjectId } from 'mongodb'
import { RoleLevel } from '~/constants/enums'

interface RoleSchema {
  _id?: ObjectId
  name: string
  level: RoleLevel
  permissions: string[]
  created_at?: Date
  updated_at?: Date
}

export default class Role {
  _id?: ObjectId
  name: string
  level: RoleLevel
  permissions: string[]
  created_at?: Date
  updated_at?: Date

  constructor(role: RoleSchema) {
    const date = new Date()

    this._id = role._id
    this.name = role.name
    this.level = role.level
    this.permissions = role.permissions || []
    this.created_at = role.created_at || date
    this.updated_at = role.updated_at || date
  }
}
