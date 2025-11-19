import { ObjectId } from 'mongodb'
import { AttachmentType, CardCommentReactionAction } from '~/constants/enums'
import { Attachment } from '~/models/Extensions'
import {
  AddCardAttachmentReqBody,
  AddCardMemberReqBody,
  AddCardCommentReqBody,
  CreateCardReqBody,
  MoveCardToDifferentColumnReqBody,
  ReactToCardCommentReqBody,
  UpdateCardAttachmentReqBody,
  UpdateCardCommentReqBody,
  UpdateCardReqBody
} from '~/models/requests/Card.requests'
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

  async updateCard(card_id: string, body: UpdateCardReqBody) {
    const card = await databaseService.cards.findOneAndUpdate(
      { _id: new ObjectId(card_id) },
      {
        $set: body,
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return card
  }

  async archiveCard(card_id: string) {
    const card = await databaseService.cards.findOneAndUpdate(
      { _id: new ObjectId(card_id) },
      {
        $set: { _destroy: true },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return card
  }

  async reopenCard(card_id: string) {
    const card = await databaseService.cards.findOneAndUpdate(
      { _id: new ObjectId(card_id) },
      {
        $set: { _destroy: false },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return card
  }

  async addCardComment({ card_id, user_id, body }: { card_id: string; user_id: string; body: AddCardCommentReqBody }) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      { projection: { password: 0, email_verify_token: 0, forgot_password_token: 0, google_id: 0 } }
    )

    const comment = {
      comment_id: new ObjectId(),
      user_id,
      user_email: user?.email || '',
      user_avatar: user?.avatar || '',
      user_display_name: user?.display_name || '',
      content: body.content,
      commented_at: new Date(),
      reactions: []
    }

    const card = await databaseService.cards.findOneAndUpdate(
      { _id: new ObjectId(card_id) },
      {
        $push: { comments: { $each: [comment], $position: 0 } },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return card
  }

  async updateCardComment({
    card_id,
    comment_id,
    body
  }: {
    card_id: string
    comment_id: string
    body: UpdateCardCommentReqBody
  }) {
    const card = await databaseService.cards.findOne({ _id: new ObjectId(card_id) })

    const comment = card?.comments?.find((comment) => comment.comment_id.equals(new ObjectId(comment_id)))

    const payload = {
      ...comment,
      ...(body.content && { content: body.content })
    }

    const updatedCard = await databaseService.cards.findOneAndUpdate(
      { _id: new ObjectId(card_id), 'comments.comment_id': new ObjectId(comment_id) },
      {
        $set: { 'comments.$[elem]': payload },
        $currentDate: { updated_at: true }
      },
      {
        returnDocument: 'after',
        arrayFilters: [{ 'elem.comment_id': new ObjectId(comment_id) }]
      }
    )

    return updatedCard
  }

  async removeCardComment(card_id: string, comment_id: string) {
    const card = await databaseService.cards.findOneAndUpdate(
      { _id: new ObjectId(card_id), 'comments.comment_id': new ObjectId(comment_id) },
      {
        $pull: { comments: { comment_id: new ObjectId(comment_id) } },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return card
  }

  async addCardAttachment({
    card_id,
    user_id,
    body
  }: {
    card_id: string
    user_id: string
    body: AddCardAttachmentReqBody
  }) {
    let payload = {}

    if (body.type === AttachmentType.Link) {
      payload = {
        type: body.type,
        link: body.link,
        attachment_id: new ObjectId(),
        uploaded_by: user_id,
        added_at: new Date()
      }
    }

    if (body.type === AttachmentType.File) {
      payload = {
        type: body.type,
        file: body.file,
        attachment_id: new ObjectId(),
        uploaded_by: user_id,
        added_at: new Date()
      }
    }

    const card = await databaseService.cards.findOneAndUpdate(
      { _id: new ObjectId(card_id) },
      {
        $push: { attachments: { $each: [payload as Attachment], $position: 0 } },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return card
  }

  async updateCardAttachment({
    card_id,
    attachment_id,
    body
  }: {
    card_id: string
    attachment_id: string
    body: UpdateCardAttachmentReqBody
  }) {
    const card = await databaseService.cards.findOne({ _id: new ObjectId(card_id) })

    const attachment = card?.attachments?.find((attachment) =>
      attachment.attachment_id.equals(new ObjectId(attachment_id))
    )

    let payload = {}

    if (body.type === AttachmentType.Link) {
      payload = {
        ...attachment,
        link: {
          ...attachment?.link,
          ...(body.link.display_name && { display_name: body.link.display_name }),
          ...(body.link.url && { url: body.link.url })
        }
      }
    }

    if (body.type === AttachmentType.File) {
      payload = {
        ...attachment,
        file: {
          ...attachment?.file,
          ...(body.file.display_name && { display_name: body.file.display_name })
        }
      }
    }

    const updatedCard = await databaseService.cards.findOneAndUpdate(
      { _id: new ObjectId(card_id), 'attachments.attachment_id': new ObjectId(attachment_id) },
      {
        $set: { 'attachments.$[elem]': payload },
        $currentDate: { updated_at: true }
      },
      {
        returnDocument: 'after',
        arrayFilters: [{ 'elem.attachment_id': new ObjectId(attachment_id) }]
      }
    )

    return updatedCard
  }

  async removeAttachment(card_id: string, attachment_id: string) {
    const card = await databaseService.cards.findOneAndUpdate(
      { _id: new ObjectId(card_id) },
      {
        $pull: { attachments: { attachment_id: new ObjectId(attachment_id) } },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return card
  }

  async addCardMember(card_id: string, body: AddCardMemberReqBody) {
    const card = await databaseService.cards.findOneAndUpdate(
      { _id: new ObjectId(card_id) },
      {
        $push: { members: new ObjectId(body.user_id) },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return card
  }

  async removeCardMember(card_id: string, user_id: string) {
    const card = await databaseService.cards.findOneAndUpdate(
      { _id: new ObjectId(card_id) },
      {
        $pull: { members: new ObjectId(user_id) },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return card
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
      { projection: { password: 0, email_verify_token: 0, forgot_password_token: 0, google_id: 0 } }
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
        {
          $push: { 'comments.$.reactions': reaction },
          $currentDate: { updated_at: true }
        },
        { returnDocument: 'after' }
      )
    }

    if (body.action === CardCommentReactionAction.Remove) {
      updatedCard = await databaseService.cards.findOneAndUpdate(
        {
          _id: new ObjectId(card_id),
          'comments.comment_id': new ObjectId(comment_id)
        },
        {
          $pull: { 'comments.$.reactions': { reaction_id: new ObjectId(body.reaction_id) } },
          $currentDate: { updated_at: true }
        },
        { returnDocument: 'after' }
      )
    }

    return updatedCard
  }

  async deleteCard(card_id: string, column_id: string) {
    // Delete the card
    await databaseService.cards.deleteOne({ _id: new ObjectId(card_id) })

    // Delete the card_id from the card_order_ids of the column containing the card
    await databaseService.columns.findOneAndUpdate(
      { _id: new ObjectId(column_id) },
      {
        $pull: { card_order_ids: new ObjectId(card_id) },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )
  }

  async moveCardToDifferentColumn(body: MoveCardToDifferentColumnReqBody) {
    const prev_card_order_ids = body.prev_card_order_ids.map((id) => new ObjectId(id))
    const next_card_order_ids = body.next_card_order_ids.map((id) => new ObjectId(id))

    // Step 1: Update the card_order_ids of Column originally contained it (understand the essence of deleting the card out of the array)
    await databaseService.columns.findOneAndUpdate(
      { _id: new ObjectId(body.prev_column_id) },
      {
        $set: { card_order_ids: prev_card_order_ids },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    // Step 2: Update card_order_ids of the next column (understand the nature of adding the card's _id to the array)
    await databaseService.columns.findOneAndUpdate(
      { _id: new ObjectId(body.next_column_id) },
      {
        $set: { card_order_ids: next_card_order_ids },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    // Step 3: Update the column_id of the card that has been dragged
    await databaseService.cards.findOneAndUpdate(
      { _id: new ObjectId(body.current_card_id) },
      {
        $set: { column_id: new ObjectId(body.next_column_id) },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return { message: 'Move card to different column successfully' }
  }
}

const cardsService = new CardsService()

export default cardsService
