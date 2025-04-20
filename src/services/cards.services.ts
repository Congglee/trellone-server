import { ObjectId } from 'mongodb'
import { CardMemberAction } from '~/constants/enums'
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
      // Case 1: Create comment data to add to the Database, need to add necessary fields
      const comment = { ...body.comment, commented_at: new Date(), user_id }

      updatedCard = await databaseService.cards.findOneAndUpdate(
        { _id: new ObjectId(card_id) },
        { $push: { comments: { $each: [comment], $position: 0 } } },
        { returnDocument: 'after' }
      )
    } else if (body.member) {
      // Case 2: In case of ADD or REMOVE member from Card
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
      // Case 3: Common update cases such as title, description, cover_photo, etc.
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
