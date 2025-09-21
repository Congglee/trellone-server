import { ObjectId } from 'mongodb'
import { BoardRole } from '~/constants/enums'
import { CreateBoardReqBody, UpdateBoardReqBody } from '~/models/requests/Board.requests'
import Board from '~/models/schemas/Board.schema'
import databaseService from '~/services/database.services'
import { envConfig } from '~/config/environment'

class BoardsService {
  async createBoard(user_id: string, body: CreateBoardReqBody) {
    const newBoard = new Board({
      title: body.title,
      description: body.description,
      type: body.type,
      members: [
        {
          user_id: new ObjectId(user_id),
          role: BoardRole.Admin,
          joined_at: new Date()
        }
      ],
      workspace_id: new ObjectId(body.workspace_id)
    })

    const result = await databaseService.boards.insertOne(newBoard)

    const board = await databaseService.boards.findOne({ _id: result.insertedId })

    return board
  }

  async getBoards({
    user_id,
    limit,
    page,
    keyword,
    state,
    workspace
  }: {
    user_id: string
    limit: number
    page: number
    keyword: string
    state?: string
    workspace?: string
  }) {
    const normalizedState = state?.toLowerCase()
    const destroyFilterValue = normalizedState === 'closed' ? true : false

    const queryConditions: any[] = [
      { members: { $elemMatch: { user_id: new ObjectId(user_id) } } },
      { _destroy: destroyFilterValue }
    ]

    if (workspace) {
      queryConditions.push({ workspace_id: new ObjectId(workspace) })
    }

    if (keyword) {
      queryConditions.push({
        title: { $regex: keyword, $options: 'i' }
      })
    }

    const [boards, total] = await Promise.all([
      await databaseService.boards
        .aggregate<Board>([
          { $match: { $and: queryConditions } },
          { $sort: { title: 1 } },
          { $skip: limit * (page - 1) },
          { $limit: limit },
          {
            $lookup: {
              from: envConfig.dbWorkspacesCollection,
              localField: 'workspace_id',
              foreignField: '_id',
              as: 'workspaceData',
              pipeline: [
                {
                  $project: { title: 1 }
                }
              ]
            }
          },
          {
            $addFields: {
              workspace: { $arrayElemAt: ['$workspaceData', 0] }
            }
          },
          {
            $project: {
              workspaceData: 0
            }
          }
        ])
        .toArray(),
      await databaseService.boards.countDocuments({ $and: queryConditions })
    ])

    return { boards, total }
  }

  async getJoinedWorkspaceBoards({
    workspace_id,
    user_id,
    limit,
    page
  }: {
    workspace_id: string
    user_id: string
    limit: number
    page: number
  }) {
    const queryConditions: any[] = [
      { workspace_id: new ObjectId(workspace_id) },
      { members: { $elemMatch: { user_id: new ObjectId(user_id) } } },
      { _destroy: false }
    ]

    const [boards, total] = await Promise.all([
      await databaseService.boards
        .aggregate<Board>([
          { $match: { $and: queryConditions } },
          { $sort: { title: 1 } },
          { $skip: limit * (page - 1) },
          { $limit: limit }
        ])
        .toArray(),
      await databaseService.boards.countDocuments({ $and: queryConditions })
    ])

    return { boards, total }
  }

  async updateBoard(board_id: string, body: UpdateBoardReqBody) {
    const payload: any = { ...body }

    if (body.workspace_id) {
      payload.workspace_id = new ObjectId(body.workspace_id)
    }

    if (body.column_order_ids) {
      payload.column_order_ids = body.column_order_ids.map((id) => new ObjectId(id))
    }

    const board = await databaseService.boards.findOneAndUpdate(
      { _id: new ObjectId(board_id) },
      {
        $set: payload,
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    return board
  }

  async leaveBoard(board_id: string, user_id: string) {
    // Step 1: Remove user from board members
    const board = await databaseService.boards.findOneAndUpdate(
      { _id: new ObjectId(board_id) },
      {
        $pull: { members: { user_id: new ObjectId(user_id) } },
        $currentDate: { updated_at: true }
      },
      { returnDocument: 'after' }
    )

    // Step 2: Remove user from all cards in this board where the user is a member
    await databaseService.cards.updateMany(
      { board_id: new ObjectId(board_id), members: new ObjectId(user_id) },
      {
        $pull: { members: new ObjectId(user_id) },
        $currentDate: { updated_at: true }
      }
    )

    return board
  }

  async deleteBoard(board_id: string) {
    // Get board to obtain workspace context and members for cleanup
    const board = await databaseService.boards.findOne({ _id: new ObjectId(board_id) })

    // 1) Delete related invitations to this board
    await databaseService.invitations.deleteMany({ 'board_invitation.board_id': new ObjectId(board_id) })

    // 2) Delete all cards in the board
    await databaseService.cards.deleteMany({ board_id: new ObjectId(board_id) })

    // 3) Delete all columns in the board
    await databaseService.columns.deleteMany({ board_id: new ObjectId(board_id) })

    // 4) Delete the board itself
    await databaseService.boards.deleteOne({ _id: new ObjectId(board_id) })

    // 5) Cleanup workspace guests for users who no longer belong to any board in this workspace
    if (board?.workspace_id) {
      const workspace = await databaseService.workspaces.findOne({ _id: new ObjectId(board.workspace_id) })

      if (workspace) {
        const memberUserIds = board.members.map((m) => m.user_id)

        for (const userId of memberUserIds) {
          // Skip if user is a workspace member
          const isWorkspaceMember = workspace.members.some((m) => m.user_id.equals(new ObjectId(userId)))

          // Skip workspace members because they should remain in the workspace regardless of board membership
          // Only guests (non-workspace members) should be removed from workspace.guests when they leave all boards
          if (isWorkspaceMember) continue

          // Check if the user is still a member of any other (open) board in the same workspace
          const remainingBoardsCount = await databaseService.boards.countDocuments({
            workspace_id: new ObjectId(board.workspace_id),
            _destroy: false,
            'members.user_id': new ObjectId(userId)
          })

          if (remainingBoardsCount === 0) {
            await databaseService.workspaces.updateOne(
              { _id: board.workspace_id },
              {
                $pull: { guests: new ObjectId(userId) },
                $currentDate: { updated_at: true }
              }
            )
          }
        }
      }
    }
  }
}

const boardsService = new BoardsService()

export default boardsService
