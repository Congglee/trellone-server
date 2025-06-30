import { ObjectId } from 'mongodb'
import {
  AttachmentType,
  CardAttachmentAction,
  CardCommentAction,
  CardCommentReactionAction,
  CardMemberAction
} from '~/constants/enums'
import { CreateCardReqBody, ReactToCardCommentReqBody, UpdateCardReqBody } from '~/models/requests/Card.requests'
import Card from '~/models/schemas/Card.schema'
import databaseService from '~/services/database.services'

class CardsService {
  async createCard(body: CreateCardReqBody) {
    const result = await databaseService.cards.insertOne(
      new Card({
        title: body.title,
        column_id: new ObjectId(body.column_id),
        board_id: new ObjectId(body.board_id)
      })
    )

    const card = await databaseService.cards.findOne({ _id: result.insertedId })

    await databaseService.columns.updateOne(
      { _id: new ObjectId(body.column_id) },
      { $push: { card_order_ids: result.insertedId } }
    )

    return card
  }

  async updateCard(card_id: string, user_id: string, body: UpdateCardReqBody) {
    let updatedCard = null

    if (body.comment) {
      // Case 1: Add, Edit or Remove comment from Card
      let updateCondition = {}
      const updateOptions: any = { returnDocument: 'after' }

      const user = await databaseService.users.findOne(
        { _id: new ObjectId(user_id) },
        { projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 } }
      )

      if (body.comment.action === CardCommentAction.Add) {
        const comment = {
          comment_id: new ObjectId(),
          user_id,
          user_email: user?.email,
          user_avatar: user?.avatar,
          user_display_name: user?.display_name,
          content: body.comment.content,
          commented_at: new Date()
        }

        updateCondition = { $push: { comments: { $each: [comment], $position: 0 } } }
      }

      if (body.comment.action === CardCommentAction.Edit) {
        // First, find the comment to update by its ID
        const card = await databaseService.cards.findOne({ _id: new ObjectId(card_id) })

        const commentToUpdate = card?.comments?.find((comment) =>
          comment.comment_id.equals(new ObjectId(body.comment?.comment_id))
        )

        // Second, put the necessary fields to update the comment into the payload
        const payload = { ...commentToUpdate, content: body.comment.content }

        // Finally, update the comment in the database
        // Using `$[elem]` to update the specific comment in the array
        updateCondition = { $set: { 'comments.$[elem]': payload } }

        // Add arrayFilters only for EDIT action to find the correct comment
        updateOptions.arrayFilters = [{ 'elem.comment_id': new ObjectId(body.comment.comment_id) }]
      }

      if (body.comment.action === CardCommentAction.Remove) {
        updateCondition = { $pull: { comments: { comment_id: new ObjectId(body.comment.comment_id) } } }
      }

      updatedCard = await databaseService.cards.findOneAndUpdate(
        { _id: new ObjectId(card_id) },
        updateCondition,
        updateOptions
      )
    } else if (body.attachment) {
      // Case 2: Add, Edit or Remove attachment from Card
      let updateCondition = {}
      const updateOptions: any = { returnDocument: 'after' }

      if (body.attachment.action === CardAttachmentAction.Add) {
        const attachment = {
          ...body.attachment,
          attachment_id: new ObjectId(),
          uploaded_by: user_id,
          added_at: new Date()
        }

        // Remove the action property from the attachment object
        delete attachment.action

        updateCondition = {
          $push: { attachments: { $each: [attachment], $position: 0 } }
        }
      }

      if (body.attachment.action === CardAttachmentAction.Edit) {
        // First, find the attachment to update by its ID
        const card = await databaseService.cards.findOne({ _id: new ObjectId(card_id) })

        const attachmentToUpdate = card?.attachments?.find((attachment) =>
          attachment.attachment_id.equals(new ObjectId(body.attachment?.attachment_id))
        )

        // Second, put the necessary fields to update the attachment into the payload
        let payload = {}

        if (body.attachment.type === AttachmentType.Link) {
          payload = {
            ...attachmentToUpdate,
            link: {
              ...attachmentToUpdate?.link,
              display_name: body.attachment.link.display_name,
              url: body.attachment.link.url
            }
          }
        }

        if (body.attachment.type === AttachmentType.File) {
          payload = {
            ...attachmentToUpdate,
            file: {
              ...attachmentToUpdate?.file,
              display_name: body.attachment.file.display_name
            }
          }
        }

        // Finally, update the attachment in the database
        // Using `$[elem]` to update the specific attachment in the array
        updateCondition = {
          $set: { 'attachments.$[elem]': payload }
        }

        // Add arrayFilters only for EDIT action to find the correct attachment
        updateOptions.arrayFilters = [{ 'elem.attachment_id': new ObjectId(body.attachment.attachment_id) }]
      }

      if (body.attachment.action === CardAttachmentAction.Remove) {
        updateCondition = {
          $pull: { attachments: { attachment_id: new ObjectId(body.attachment.attachment_id) } }
        }
      }

      updatedCard = await databaseService.cards.findOneAndUpdate(
        { _id: new ObjectId(card_id) },
        updateCondition,
        updateOptions
      )
    } else if (body.member) {
      // Case 3: Add or Remove member from Card
      let updateCondition = {}

      if (body.member.action === CardMemberAction.Add) {
        updateCondition = { $push: { members: new ObjectId(body.member.user_id) } }
      }

      if (body.member.action === CardMemberAction.Remove) {
        updateCondition = { $pull: { members: new ObjectId(body.member.user_id) } }
      }

      updatedCard = await databaseService.cards.findOneAndUpdate({ _id: new ObjectId(card_id) }, updateCondition, {
        returnDocument: 'after'
      })
    } else {
      // Case 4: Common update cases such as title, description, cover_photo, etc.
      updatedCard = await databaseService.cards.findOneAndUpdate(
        { _id: new ObjectId(card_id) },
        {
          $set: body,
          $currentDate: { updated_at: true }
        },
        { returnDocument: 'after' }
      )
    }

    return updatedCard
  }

  async reactToCardComment({
    card_id,
    user_id,
    comment_id,
    body
  }: {
    card_id: string
    user_id: string
    comment_id: string
    body: ReactToCardCommentReqBody
  }) {
    let updatedCard = null

    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      { projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 } }
    )

    if (body.action === CardCommentReactionAction.Add) {
      const reaction = {
        reaction_id: new ObjectId(),
        emoji: body.emoji,
        user_id,
        user_email: user?.email,
        user_display_name: user?.display_name,
        reacted_at: new Date()
      }

      updatedCard = await databaseService.cards.findOneAndUpdate(
        {
          _id: new ObjectId(card_id),
          'comments.comment_id': new ObjectId(comment_id)
        },
        { $push: { 'comments.$.reactions': reaction } },
        { returnDocument: 'after' }
      )
    }

    if (body.action === CardCommentReactionAction.Remove) {
      updatedCard = await databaseService.cards.findOneAndUpdate(
        {
          _id: new ObjectId(card_id),
          'comments.comment_id': new ObjectId(comment_id)
        },
        { $pull: { 'comments.$.reactions': { reaction_id: new ObjectId(body.reaction_id) } } },
        { returnDocument: 'after' }
      )
    }

    return updatedCard
  }
}

const cardsService = new CardsService()

export default cardsService
