import HTTP_STATUS from '~/constants/httpStatus'
import { BOARDS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import Board from '~/models/schemas/Board.schema'

export const assertBoardIsOpen = (board: Board) => {
  if (board && (board as { _destroy?: boolean })._destroy) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.FORBIDDEN,
      message: BOARDS_MESSAGES.BOARD_IS_CLOSED_REOPEN_REQUIRED
    })
  }
}
