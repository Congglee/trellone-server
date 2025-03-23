import Board from '~/models/schemas/Board.schema'
import Column from '~/models/schemas/Column.schema'
import User from '~/models/schemas/User.schema'

declare module 'express' {
  interface Request {
    user?: User
    board?: Board
    column?: Column
  }
}
