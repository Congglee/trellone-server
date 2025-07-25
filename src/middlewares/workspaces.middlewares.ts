import { checkSchema } from 'express-validator'
import { WORKSPACES_MESSAGES } from '~/constants/messages'
import { validate } from '~/utils/validation'

export const createWorkspaceValidator = validate(
  checkSchema(
    {
      title: {
        notEmpty: { errorMessage: WORKSPACES_MESSAGES.WORKSPACE_TITLE_IS_REQUIRED },
        isString: { errorMessage: WORKSPACES_MESSAGES.WORKSPACE_TITLE_MUST_BE_STRING },
        trim: true,
        isLength: {
          options: { min: 3, max: 50 },
          errorMessage: WORKSPACES_MESSAGES.WORKSPACE_TITLE_LENGTH_MUST_BE_BETWEEN_3_AND_50
        }
      },
      description: {
        optional: true,
        isString: { errorMessage: WORKSPACES_MESSAGES.WORKSPACE_DESCRIPTION_MUST_BE_STRING },
        trim: true,
        isLength: {
          options: { min: 3, max: 256 },
          errorMessage: WORKSPACES_MESSAGES.WORKSPACE_DESCRIPTION_MUST_BE_BETWEEN_3_AND_256
        }
      }
    },
    ['body']
  )
)
