import { NextFunction, Request, Response } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { AttachmentType, CardCommentReactionAction } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { CARDS_MESSAGES } from '~/constants/messages'
import { ISO8601_REGEX } from '~/constants/regex'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import Card from '~/models/schemas/Card.schema'
import databaseService from '~/services/database.services'
import { stringEnumToArray } from '~/utils/commons'
import { assertCardIsOpen } from '~/utils/guards'
import { wrapRequestHandler } from '~/utils/handlers'
import { validate } from '~/utils/validation'

const attachmentTypes = stringEnumToArray(AttachmentType)

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

            const isUserCardMember = await databaseService.boards.countDocuments({
              _id: card.board_id,
              members: { $elemMatch: { user_id: new ObjectId(user_id) } }
            })

            if (!isUserCardMember) {
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
      }
    },
    ['body']
  )
)

const cardCommentContentSchema: ParamSchema = {
  notEmpty: { errorMessage: CARDS_MESSAGES.COMMENT_CONTENT_IS_REQUIRED },
  isString: { errorMessage: CARDS_MESSAGES.COMMENT_CONTENT_MUST_BE_STRING },
  trim: true
}

export const addCardCommentValidator = validate(
  checkSchema(
    {
      content: cardCommentContentSchema
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

export const updateCardCommentValidator = validate(
  checkSchema(
    {
      content: { ...cardCommentContentSchema, optional: true, notEmpty: undefined }
    },
    ['body']
  )
)

const cardAttachmentTypeSchema: ParamSchema = {
  isIn: {
    options: [attachmentTypes],
    errorMessage: CARDS_MESSAGES.ATTACHMENT_TYPE_MUST_BE_FILE_OR_LINK
  }
}

const cardAttachmentFileSchema: ParamSchema = {
  notEmpty: { errorMessage: CARDS_MESSAGES.ATTACHMENT_FILE_IS_REQUIRED },
  isObject: { errorMessage: CARDS_MESSAGES.ATTACHMENT_FILE_MUST_BE_OBJECT },
  custom: {
    options: (value, { req }) => {
      const attachmentType = (req as Request).body.type

      if (attachmentType === AttachmentType.File) {
        // File attachment required fields
        const requiredFields = ['url', 'mime_type']
        const hasAllFields = requiredFields.every((field) => value && typeof value === 'object' && field in value)

        if (!hasAllFields) {
          throw new ErrorWithStatus({
            status: HTTP_STATUS.BAD_REQUEST,
            message: `${CARDS_MESSAGES.ATTACHMENT_FILE_MISSING_REQUIRED_FIELDS}: ${requiredFields.join(', ')}`
          })
        }
      }

      return true
    }
  }
}

const cardAttachmentLinkSchema: ParamSchema = {
  notEmpty: { errorMessage: CARDS_MESSAGES.ATTACHMENT_LINK_IS_REQUIRED },
  isObject: { errorMessage: CARDS_MESSAGES.ATTACHMENT_LINK_MUST_BE_OBJECT },
  custom: {
    options: (value, { req }) => {
      const attachmentType = (req as Request).body.type

      if (attachmentType === AttachmentType.Link) {
        // Link attachment required fields
        const requiredFields = ['url']
        const hasAllFields = requiredFields.every((field) => value && typeof value === 'object' && field in value)

        if (!hasAllFields) {
          throw new ErrorWithStatus({
            status: HTTP_STATUS.BAD_REQUEST,
            message: `${CARDS_MESSAGES.ATTACHMENT_LINK_MISSING_REQUIRED_FIELDS}: ${requiredFields.join(', ')}`
          })
        }
      }

      return true
    }
  }
}

export const addCardAttachmentValidator = validate(
  checkSchema(
    {
      type: cardAttachmentTypeSchema,
      file: cardAttachmentFileSchema,
      link: cardAttachmentLinkSchema
    },
    ['body']
  )
)

export const attachmentIdValidator = validate(
  checkSchema(
    {
      attachment_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: CARDS_MESSAGES.INVALID_ATTACHMENT_ID
              })
            }

            const card = (req as Request).card

            const attachment = card?.attachments?.find((attachment) =>
              attachment.attachment_id.equals(new ObjectId(value))
            )

            if (!attachment) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: CARDS_MESSAGES.ATTACHMENT_NOT_FOUND
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

export const updateCardAttachmentValidator = validate(
  checkSchema(
    {
      type: { ...cardAttachmentTypeSchema, optional: true },
      file: { ...cardAttachmentFileSchema, optional: true, notEmpty: undefined },
      link: { ...cardAttachmentLinkSchema, optional: true, notEmpty: undefined }
    },
    ['body']
  )
)

export const addCardMemberValidator = validate(
  checkSchema(
    {
      user_id: {
        notEmpty: { errorMessage: CARDS_MESSAGES.USER_ID_IS_REQUIRED },
        isString: { errorMessage: CARDS_MESSAGES.USER_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: CARDS_MESSAGES.INVALID_USER_ID
              })
            }

            const user = await databaseService.users.findOne({
              _id: new ObjectId(value)
            })

            if (!user) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: CARDS_MESSAGES.USER_NOT_FOUND
              })
            }

            const card = (req as Request).card
            const isMemberExists = card?.members?.some((id) => id.equals(new ObjectId(value)))

            if (isMemberExists) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: CARDS_MESSAGES.MEMBER_ALREADY_EXISTS
              })
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const cardMemberIdValidator = validate(
  checkSchema(
    {
      user_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: CARDS_MESSAGES.INVALID_USER_ID
              })
            }

            const card = (req as Request).card

            const member = card?.members?.find((member) => member.equals(new ObjectId(value)))

            if (!member) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: CARDS_MESSAGES.MEMBER_NOT_FOUND
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

export const moveCardToDifferentColumnValidator = validate(
  checkSchema(
    {
      current_card_id: {
        notEmpty: { errorMessage: CARDS_MESSAGES.CURRENT_CARD_ID_IS_REQUIRED },
        isString: { errorMessage: CARDS_MESSAGES.CURRENT_CARD_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(CARDS_MESSAGES.INVALID_CARD_ID)
            }

            const card = await databaseService.cards.findOne({
              _id: new ObjectId(value)
            })

            if (!card) {
              throw new Error(CARDS_MESSAGES.CARD_NOT_FOUND)
            }

            return true
          }
        }
      },
      prev_column_id: {
        notEmpty: { errorMessage: CARDS_MESSAGES.PREV_COLUMN_ID_IS_REQUIRED },
        isString: { errorMessage: CARDS_MESSAGES.PREV_COLUMN_ID_MUST_BE_STRING },
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
      },
      prev_card_order_ids: {
        isArray: { errorMessage: CARDS_MESSAGES.PREV_CARD_ORDER_IDS_MUST_BE_AN_ARRAY },
        custom: {
          options: async (value) => {
            if (value.some((id: string) => !ObjectId.isValid(id))) {
              throw new Error(CARDS_MESSAGES.INVALID_CARD_ID)
            }

            return true
          }
        }
      },
      next_column_id: {
        notEmpty: { errorMessage: CARDS_MESSAGES.NEXT_COLUMN_ID_IS_REQUIRED },
        isString: { errorMessage: CARDS_MESSAGES.NEXT_COLUMN_ID_MUST_BE_STRING },
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
      },
      next_card_order_ids: {
        isArray: { errorMessage: CARDS_MESSAGES.NEXT_CARD_ORDER_IDS_MUST_BE_AN_ARRAY },
        custom: {
          options: async (value) => {
            if (value.some((id: string) => !ObjectId.isValid(id))) {
              throw new Error(CARDS_MESSAGES.INVALID_CARD_ID)
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const ensureCardOpen = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const card = (req as Request).card as Card

  assertCardIsOpen(card)

  next()
})

export const ensureCardClosed = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const card = (req as Request).card as Card

  if (!card || !card._destroy) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.BAD_REQUEST,
      message: CARDS_MESSAGES.CARD_IS_NOT_ARCHIVED
    })
  }

  next()
})
