import { ObjectId } from 'mongodb'
import { UserVerifyStatus } from '~/constants/enums'

interface UserSchema {
  _id?: ObjectId
  email: string
  password: string
  username: string
  display_name: string
  avatar?: string
  is_active?: boolean
  email_verify_token?: string
  forgot_password_token?: string
  verify?: UserVerifyStatus
  _destroy?: boolean
  created_at?: Date
  updated_at?: Date
}

export default class User {
  _id?: ObjectId
  email: string
  password: string
  username: string
  display_name: string
  avatar: string
  is_active: boolean
  email_verify_token: string
  forgot_password_token: string
  verify: UserVerifyStatus
  _destroy: boolean
  created_at?: Date
  updated_at?: Date

  constructor(user: UserSchema) {
    const date = new Date()

    this._id = user._id
    this.email = user.email
    this.password = user.password
    this.username = user.username
    this.display_name = user.display_name || ''
    this.avatar = user.avatar || ''
    this.is_active = user.is_active || true
    this.email_verify_token = user.email_verify_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.verify = user.verify || UserVerifyStatus.Unverified
    this._destroy = user._destroy || false
    this.created_at = user.created_at || date
    this.updated_at = user.updated_at || date
  }
}
