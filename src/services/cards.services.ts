import { ObjectId } from 'mongodb'
import { CreateCardReqBody } from '~/models/requests/Card.requests'
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
}

const cardsService = new CardsService()

export default cardsService
