import { ObjectId } from 'mongodb'
import { AttachmentType, CardAttachmentAction, CardCommentAction, CardMemberAction } from '~/constants/enums'
import { CreateCardReqBody, UpdateCardReqBody } from '~/models/requests/Card.requests'
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
      // Case 1: In case of ADD, EDIT or REMOVE comment from Card
      let updateCondition = {}
      const updateOptions: any = { returnDocument: 'after' }

      if (body.comment.action === CardCommentAction.Add) {
        const comment = {
          ...body.comment,
          comment_id: new ObjectId(),
          commented_at: new Date(),
          user_id
        }

        // Remove the action property from the comment object
        delete comment.action

        updateCondition = { $push: { comments: { $each: [comment], $position: 0 } } }
      }

      if (body.comment.action === CardCommentAction.Edit) {
        // First, find the comment by its ID
        const card = await databaseService.cards.findOne({ _id: new ObjectId(card_id) })

        const commentToUpdate = card?.comments?.find((comment) =>
          comment.comment_id.equals(new ObjectId(body.comment?.comment_id))
        )

        // Second, put the necessary fields to update the comment into the payload
        const payload = {
          ...commentToUpdate,
          content: body.comment.content
        }

        // Finally, update the comment in the database
        // Using `$[elem]` to update the specific element in the array
        // ?) The `$[elem]` syntax allows you to update an array element that matches the filter criteria
        updateCondition = { $set: { 'comments.$[elem]': payload } }

        // Add arrayFilters only for EDIT action to find the correct attachment
        // ?) The `arrayFilters` option allows you to specify conditions for the elements in the array that you want to update
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
      // Case 2: In case of ADD, EDIT or REMOVE attachment from Card
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
        // First, find the attachment by its ID
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

        updateCondition = {
          $set: { 'attachments.$[elem]': payload }
        }

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
      // Case 3: In case of ADD or REMOVE member from Card
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
}

const cardsService = new CardsService()

export default cardsService
