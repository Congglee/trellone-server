import Board from '~/models/schemas/Board.schema'

declare module 'express' {
  interface Request {
    board?: Board
  }
}
