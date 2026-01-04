import HTTP_STATUS from '~/constants/http-status'
import { COMMON_MESSAGES } from '~/constants/messages'

type ErrorsType = Record<
  string,
  {
    msg: string
    [key: string]: any
  }
>

export class ErrorWithStatus {
  message: string
  status: number
  error_code?: string

  constructor({ message, status, error_code }: { message: string; status: number; error_code?: string }) {
    this.message = message
    this.status = status
    this.error_code = error_code
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorsType

  constructor({ message = COMMON_MESSAGES.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorsType }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY })
    this.errors = errors
  }
}
