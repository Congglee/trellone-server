import { NextFunction, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { RoleLevel } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { BOARDS_MESSAGES, WORKSPACES_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import Workspace from '~/models/schemas/Workspace.schema'
import databaseService from '~/services/database.services'
import { wrapRequestHandler } from '~/utils/handlers'

export const requireWorkspacePermission = (permissions: string[] = []) => {
  return wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Step 01: Ensure JWT token is valid and decoded data is available
    const { user_id } = req.decoded_authorization as TokenPayload
    const workspace = req.workspace as Workspace

    if (!workspace) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: WORKSPACES_MESSAGES.WORKSPACE_NOT_FOUND
      })
    }

    // Step 02: Retrieve the user's role from the workspace members array
    const userMembership = workspace.members.find((member) => member.user_id.toString() === user_id)

    if (!userMembership) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: WORKSPACES_MESSAGES.USER_NOT_MEMBER_OF_WORKSPACE
      })
    }

    // Step 03: Check if permissions array is empty (no permission check required)
    if (!permissions || permissions.length === 0) {
      return next()
    }

    // Step 04: Query the database to get the full role information with permissions
    const role = await databaseService.roles.findOne({
      name: userMembership.role,
      level: RoleLevel.Workspace
    })

    if (!role) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: WORKSPACES_MESSAGES.WORKSPACE_ROLE_NOT_FOUND
      })
    }

    // Step 05: Check if user has all required permissions
    const hasAllPermissions = permissions.every((permission) => role.permissions.includes(permission))

    if (!hasAllPermissions) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: WORKSPACES_MESSAGES.INSUFFICIENT_WORKSPACE_PERMISSIONS
      })
    }

    // Step 06: If role and permissions are valid, proceed to controller
    next()
  })
}

export const requireWorkspacePermissionForBoard = (permissions: string[] = []) => {
  return wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Step 01: Ensure JWT token is valid and decoded data is available
    const { user_id } = req.decoded_authorization as TokenPayload
    let workspace: Workspace | null = null

    if (req.body?.workspace_id) {
      // Step 02: First, check if there is a `workspace_id` in `req.body`; if so, then start retrieving the workspace.
      workspace = await databaseService.workspaces.findOne({
        _id: new ObjectId(req.body.workspace_id),
        _destroy: false
      })

      if (!workspace) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.NOT_FOUND,
          message: WORKSPACES_MESSAGES.WORKSPACE_NOT_FOUND
        })
      }
    } else if (req.params?.board_id) {
      // Step 03: Next, if there is no `workspace_id` in `req.body`, then get the `board_id` from `req.params`, retrieve the board, and then continue to retrieve the workspace from that board.
      const board = await databaseService.boards.findOne({
        _id: new ObjectId(req.params.board_id),
        _destroy: false
      })

      if (!board) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.NOT_FOUND,
          message: BOARDS_MESSAGES.BOARD_NOT_FOUND
        })
      }

      if (!board.workspace_id) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.BAD_REQUEST,
          message: 'Board does not have an associated workspace'
        })
      }

      workspace = await databaseService.workspaces.findOne({
        _id: new ObjectId(board.workspace_id),
        _destroy: false
      })

      if (!workspace) {
        throw new ErrorWithStatus({
          status: HTTP_STATUS.NOT_FOUND,
          message: WORKSPACES_MESSAGES.WORKSPACE_NOT_FOUND
        })
      }
    } else {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: 'Either workspace_id in body or board_id in params is required'
      })
    }

    // Step 04: Check if user is a guest in the workspace (skip permission checks for guests)
    const isGuest = workspace.guests?.some((guest_id) => guest_id.toString() === user_id)

    if (isGuest) {
      // Guest users bypass all permission checks
      return next()
    }

    // Step 05: Check if user is a member of the workspace
    const userMembership = workspace.members.find((member) => member.user_id.toString() === user_id)

    if (!userMembership) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: WORKSPACES_MESSAGES.USER_NOT_MEMBER_OF_WORKSPACE
      })
    }

    // Step 06: Check if permissions array is empty (no permission check required)
    if (!permissions || permissions.length === 0) {
      return next()
    }

    // Step 07: Query the database to get the full role information with permissions
    const role = await databaseService.roles.findOne({
      name: userMembership.role,
      level: RoleLevel.Workspace
    })

    if (!role) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: WORKSPACES_MESSAGES.WORKSPACE_ROLE_NOT_FOUND
      })
    }

    // Step 08: Check if user has at least one of the required permissions
    const hasRequiredPermission = permissions.some((permission) => role.permissions.includes(permission))

    if (!hasRequiredPermission) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: WORKSPACES_MESSAGES.INSUFFICIENT_WORKSPACE_PERMISSIONS
      })
    }

    // Step 09: If role and permissions are valid, proceed to controller
    next()
  })
}
