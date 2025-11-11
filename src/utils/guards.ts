import HTTP_STATUS from '~/constants/httpStatus'
import { BOARDS_MESSAGES, CARDS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import Board from '~/models/schemas/Board.schema'
import Card from '~/models/schemas/Card.schema'

export const assertBoardIsOpen = (board: Board) => {
  if (board && (board as { _destroy?: boolean })._destroy) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.FORBIDDEN,
      message: BOARDS_MESSAGES.BOARD_IS_CLOSED_REOPEN_REQUIRED
    })
  }
}

export const assertCardIsOpen = (card: Card) => {
  if (card && (card as { _destroy?: boolean })._destroy) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.FORBIDDEN,
      message: CARDS_MESSAGES.CARD_IS_ARCHIVED_REOPEN_REQUIRED
    })
  }
}
