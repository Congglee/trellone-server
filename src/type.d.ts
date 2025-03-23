import Board from '~/models/schemas/Board.schema'
import Column from '~/models/schemas/Column.schema'

declare module 'express' {
  interface Request {
    board?: Board
    column?: Column
  }
}
