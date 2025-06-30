import { Request } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import {
  AttachmentType,
  CardAttachmentAction,
  CardCommentAction,
  CardCommentReactionAction,
  CardMemberAction
} from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { CARDS_MESSAGES } from '~/constants/messages'
import { ISO8601_REGEX } from '~/constants/regex'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'

const cardTitleSchema: ParamSchema = {
  notEmpty: { errorMessage: CARDS_MESSAGES.CARD_TITLE_IS_REQUIRED },
  isString: { errorMessage: CARDS_MESSAGES.CARD_TITLE_MUST_BE_STRING },
  trim: true,
  isLength: {
    options: { min: 3, max: 50 },
    errorMessage: CARDS_MESSAGES.CARD_TITLE_LENGTH_MUST_BE_BETWEEN_3_AND_50
  }
}

export const createCardValidator = validate(
  checkSchema(
    {
      title: cardTitleSchema,
      board_id: {
        notEmpty: { errorMessage: CARDS_MESSAGES.BOARD_ID_IS_REQUIRED },
        isString: { errorMessage: CARDS_MESSAGES.BOARD_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(CARDS_MESSAGES.INVALID_BOARD_ID)
            }

            const board = await databaseService.boards.findOne({
              _id: new ObjectId(value)
            })

            if (!board) {
              throw new Error(CARDS_MESSAGES.BOARD_NOT_FOUND)
            }

            return true
          }
        }
      },
      column_id: {
        notEmpty: { errorMessage: CARDS_MESSAGES.COLUMN_ID_IS_REQUIRED },
        isString: { errorMessage: CARDS_MESSAGES.COLUMN_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(CARDS_MESSAGES.INVALID_COLUMN_ID)
            }

            const column = await databaseService.columns.findOne({
              _id: new ObjectId(value)
            })

            if (!column) {
              throw new Error(CARDS_MESSAGES.COLUMN_NOT_FOUND)
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const cardIdValidator = validate(
  checkSchema(
    {
      card_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: CARDS_MESSAGES.INVALID_CARD_ID
              })
            }

            const card = await databaseService.cards.findOne({
              _id: new ObjectId(value)
            })

            if (!card) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: CARDS_MESSAGES.CARD_NOT_FOUND
              })
            }

            const { user_id } = (req as Request).decoded_authorization as TokenPayload

            const isUserCardOwner = await databaseService.boards.countDocuments({
              _id: card.board_id,
              $or: [
                {
                  owners: { $in: [new ObjectId(user_id)] }
                },
                {
                  members: { $in: [new ObjectId(user_id)] }
                }
              ]
            })

            if (!isUserCardOwner) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.FORBIDDEN,
                message: CARDS_MESSAGES.CARD_NOT_BELONG_TO_USER
              })
            }

            ;(req as Request).card = card

            return true
          }
        }
      }
    },
    ['params']
  )
)

export const updateCardValidator = validate(
  checkSchema(
    {
      title: { ...cardTitleSchema, optional: true, notEmpty: undefined },
      due_date: {
        optional: true,
        custom: {
          options: (value) => {
            // Allow null value for due_date
            if (value === null) {
              return true
            }

            // Check if the due_date value is a valid ISO 8601 date string
            const isValidDate = ISO8601_REGEX.test(value)

            if (!isValidDate) {
              throw new Error(CARDS_MESSAGES.CARD_DUE_DATE_MUST_BE_ISO8601)
            }

            return true
          }
        }
      },
      is_completed: {
        optional: true,
        custom: {
          options: (value) => {
            // Allow null value for is_completed
            if (value === null) {
              return true
            }

            // Check if the is_completed value is a boolean
            if (typeof value !== 'boolean') {
              throw new Error(CARDS_MESSAGES.CARD_COMPLETION_STATUS_MUST_BE_BOOLEAN)
            }

            return true
          }
        }
      },
      description: {
        optional: true,
        isString: { errorMessage: CARDS_MESSAGES.CARD_DESCRIPTION_MUST_BE_STRING }
      },
      cover_photo: {
        optional: true,
        isString: { errorMessage: CARDS_MESSAGES.COVER_PHOTO_MUST_BE_STRING }
      },
      _destroy: {
        optional: true,
        custom: {
          options: (value) => {
            if (typeof value !== 'boolean' && typeof value !== 'undefined') {
              throw new Error(CARDS_MESSAGES.CARD_ARCHIVE_STATUS_MUST_BE_BOOLEAN)
            }

            return true
          }
        },
        toBoolean: true
      },
      comment: {
        optional: true,
        isObject: { errorMessage: CARDS_MESSAGES.COMMENT_MUST_BE_OBJECT },
        custom: {
          options: (value, { req }) => {
            // Ensure all required fields are present in the comment object
            const requiredFields = ['action', 'content']
            const hasAllRequiredFields = requiredFields.every((field) => field in value)

            if (!hasAllRequiredFields) {
              throw new Error(`${CARDS_MESSAGES.COMMENT_MISSING_REQUIRED_FIELDS}: ${requiredFields.join(', ')}`)
            }

            if (typeof value.content !== 'string') {
              throw new Error(CARDS_MESSAGES.COMMENT_CONTENT_MUST_BE_STRING)
            }

            const card = (req as Request).card
            const { user_id } = (req as Request).decoded_authorization as TokenPayload

            // Validate the action is either Add, Edit or Remove in the comment object
            if (![CardCommentAction.Add, CardCommentAction.Edit, CardCommentAction.Remove].includes(value.action)) {
              throw new Error(CARDS_MESSAGES.INVALID_COMMENT_ACTION)
            }

            // If the action is Edit or Remove, validate the comment_id
            if (value.action === CardCommentAction.Edit || value.action === CardCommentAction.Remove) {
              if (!value.comment_id) {
                throw new Error(CARDS_MESSAGES.COMMENT_ID_IS_REQUIRED)
              }

              if (!ObjectId.isValid(value.comment_id)) {
                throw new Error(CARDS_MESSAGES.INVALID_COMMENT_ID)
              }

              // Check if the comment exists in the card and owned by the user
              const comment = card?.comments?.find(
                (comment) =>
                  comment.comment_id.equals(new ObjectId(value.comment_id)) && comment.user_id.toString() === user_id
              )

              if (!comment) {
                throw new Error(CARDS_MESSAGES.COMMENT_NOT_FOUND)
              }
            }

            return true
          }
        }
      },
      member: {
        optional: true,
        isObject: { errorMessage: CARDS_MESSAGES.MEMBER_MUST_BE_OBJECT },
        custom: {
          options: (value, { req }) => {
            // Ensure all required fields are present in the member object
            const requiredFields = ['action', 'user_id']
            const hasAllRequiredFields = requiredFields.every((field) => field in value)

            if (!hasAllRequiredFields) {
              throw new Error(`${CARDS_MESSAGES.MEMBER_MISSING_REQUIRED_FIELDS}: ${requiredFields.join(', ')}`)
            }

            // Validate the action is either Add or Remove in the member object
            if (![CardMemberAction.Add, CardMemberAction.Remove].includes(value.action)) {
              throw new Error(CARDS_MESSAGES.INVALID_MEMBER_ACTION)
            }

            const card = (req as Request).card
            const isMemberExists = card?.members?.some((id) => id.equals(new ObjectId(value.user_id)))

            // For ADD action, check if member already exists
            if (value.action === CardMemberAction.Add && isMemberExists) {
              throw new Error(CARDS_MESSAGES.MEMBER_ALREADY_EXISTS)
            }

            // For REMOVE action, check if member doesn't exist
            if (value.action === CardMemberAction.Remove && !isMemberExists) {
              throw new Error(CARDS_MESSAGES.MEMBER_NOT_FOUND)
            }

            if (typeof value.user_id !== 'string' || !ObjectId.isValid(value.user_id)) {
              throw new Error(CARDS_MESSAGES.INVALID_MEMBER_ID)
            }

            return true
          }
        }
      },
      attachment: {
        optional: true,
        isObject: { errorMessage: CARDS_MESSAGES.ATTACHMENT_MUST_BE_OBJECT },
        custom: {
          options: (value, { req }) => {
            // Ensure all required fields are present in the attachment object
            const requiredFields = ['type', 'action']
            const hasAllRequiredFields = requiredFields.every((field) => field in value)

            if (!hasAllRequiredFields) {
              throw new Error(`${CARDS_MESSAGES.ATTACHMENT_MISSING_REQUIRED_FIELDS}: ${requiredFields.join(', ')}`)
            }

            // File attachment required fields
            const fileRequiredFields = ['url', 'mime_type']
            const hasAllFileFields = fileRequiredFields.every(
              (field) => value.file && typeof value.file === 'object' && field in value.file
            )

            // Link attachment required fields
            const linkRequiredFields = ['url']
            const hasAllLinkFields = linkRequiredFields.every(
              (field) => value.link && typeof value.link === 'object' && field in value.link
            )

            const card = (req as Request).card

            // Validate the action is either Add or Remove
            if (
              ![CardAttachmentAction.Add, CardAttachmentAction.Edit, CardAttachmentAction.Remove].includes(value.action)
            ) {
              throw new Error(CARDS_MESSAGES.INVALID_ATTACHMENT_ACTION)
            }

            // Validate the type is either File or Link
            if (![AttachmentType.File, AttachmentType.Link].includes(value.type)) {
              throw new Error(CARDS_MESSAGES.INVALID_ATTACHMENT_TYPE)
            }

            // If the action is Add, validate the type and required fields
            if (value.action === CardAttachmentAction.Add) {
              // If the type is File, validate the required fields
              if (value.type === AttachmentType.File) {
                // Ensure the file is an object and has required fields
                if (!hasAllFileFields) {
                  throw new Error(
                    `${CARDS_MESSAGES.ATTACHMENT_FILE_MISSING_REQUIRED_FIELDS}: ${fileRequiredFields.join(', ')}`
                  )
                }
              }

              // If the type is Link, validate the required fields
              if (value.type === AttachmentType.Link) {
                // Ensure the link is an object and has required fields
                if (!hasAllLinkFields) {
                  throw new Error(
                    `${CARDS_MESSAGES.ATTACHMENT_LINK_MISSING_REQUIRED_FIELDS}: ${linkRequiredFields.join(', ')}`
                  )
                }
              }
            }

            if (value.action === CardAttachmentAction.Edit) {
              if (!ObjectId.isValid(value.attachment_id)) {
                throw new Error(CARDS_MESSAGES.INVALID_ATTACHMENT_ID)
              }

              const isAttachmentExists = card?.attachments?.some((attachment) =>
                attachment.attachment_id.equals(new ObjectId(value.attachment_id))
              )

              // Check if the attachment exists in the card
              if (!isAttachmentExists) {
                throw new Error(CARDS_MESSAGES.ATTACHMENT_NOT_FOUND)
              }

              if (value.type === AttachmentType.Link) {
                // Ensure the link is an object and has required fields
                if (!hasAllLinkFields) {
                  throw new Error(
                    `${CARDS_MESSAGES.ATTACHMENT_LINK_MISSING_REQUIRED_FIELDS}: ${linkRequiredFields.join(', ')}`
                  )
                }
              }
            }

            // If the action is Remove, validate the attachment_id
            if (value.action === CardAttachmentAction.Remove) {
              if (!ObjectId.isValid(value.attachment_id)) {
                throw new Error(CARDS_MESSAGES.INVALID_ATTACHMENT_ID)
              }

              const isAttachmentExists = card?.attachments?.some((attachment) =>
                attachment.attachment_id.equals(new ObjectId(value.attachment_id))
              )

              // Check if the attachment exists in the card
              if (!isAttachmentExists) {
                throw new Error(CARDS_MESSAGES.ATTACHMENT_NOT_FOUND)
              }
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const commentIdValidator = validate(
  checkSchema(
    {
      comment_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: CARDS_MESSAGES.INVALID_COMMENT_ID
              })
            }

            const card = (req as Request).card

            const comment = card?.comments?.find((comment) => comment.comment_id.equals(new ObjectId(value)))

            if (!comment) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: CARDS_MESSAGES.COMMENT_NOT_FOUND
              })
            }

            return true
          }
        }
      }
    },
    ['params']
  )
)

export const reactionToCardCommentValidator = validate(
  checkSchema(
    {
      action: {
        notEmpty: { errorMessage: CARDS_MESSAGES.REACTION_ACTION_IS_REQUIRED },
        isString: { errorMessage: CARDS_MESSAGES.REACTION_ACTION_MUST_BE_STRING },
        trim: true,
        custom: {
          options: (value) => {
            if (![CardCommentReactionAction.Add, CardCommentReactionAction.Remove].includes(value)) {
              throw new Error(CARDS_MESSAGES.INVALID_REACTION_ACTION)
            }

            return true
          }
        }
      },
      emoji: {
        trim: true,
        custom: {
          options: (value, { req }) => {
            const action = (req as Request).body.action

            if (action === CardCommentReactionAction.Add) {
              if (!value) {
                throw new Error(CARDS_MESSAGES.REACTION_EMOJI_IS_REQUIRED)
              }

              if (typeof value !== 'string' || value.length < 1 || value.length > 2) {
                throw new Error(CARDS_MESSAGES.REACTION_EMOJI_MUST_BE_STRING_AND_1_2_CHARACTERS)
              }
            }

            return true
          }
        }
      },
      reaction_id: {
        optional: true,
        isString: { errorMessage: CARDS_MESSAGES.REACTION_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: (value, { req }) => {
            const comment_id = (req as Request).params.comment_id
            const action = (req as Request).body.action
            const card = (req as Request).card

            const comment = card?.comments?.find((comment) => comment.comment_id.equals(new ObjectId(comment_id)))

            if (action === CardCommentReactionAction.Remove) {
              if (!value) {
                throw new Error(CARDS_MESSAGES.REACTION_ID_IS_REQUIRED)
              }

              if (!ObjectId.isValid(value)) {
                throw new Error(CARDS_MESSAGES.INVALID_REACTION_ID)
              }

              const reaction = comment?.reactions?.find((reaction) => reaction.reaction_id.equals(new ObjectId(value)))

              if (!reaction) {
                throw new Error(CARDS_MESSAGES.REACTION_NOT_FOUND)
              }
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)
