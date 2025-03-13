import { BoardType } from '~/constants/enums'

export interface CreateBoardReqBody {
  title: string
  description?: string
  type: BoardType
}
