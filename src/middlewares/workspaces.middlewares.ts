import { Request } from 'express'
import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/environment'
import HTTP_STATUS from '~/constants/httpStatus'
import { WORKSPACES_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import Workspace from '~/models/schemas/Workspace.schema'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'

export const createWorkspaceValidator = validate(
  checkSchema(
    {
      title: {
        notEmpty: { errorMessage: WORKSPACES_MESSAGES.WORKSPACE_TITLE_IS_REQUIRED },
        isString: { errorMessage: WORKSPACES_MESSAGES.WORKSPACE_TITLE_MUST_BE_STRING },
        trim: true,
        isLength: {
          options: { min: 3, max: 50 },
          errorMessage: WORKSPACES_MESSAGES.WORKSPACE_TITLE_LENGTH_MUST_BE_BETWEEN_3_AND_50
        }
      },
      description: {
        optional: true,
        isString: { errorMessage: WORKSPACES_MESSAGES.WORKSPACE_DESCRIPTION_MUST_BE_STRING },
        trim: true,
        isLength: {
          options: { min: 3, max: 256 },
          errorMessage: WORKSPACES_MESSAGES.WORKSPACE_DESCRIPTION_MUST_BE_BETWEEN_3_AND_256
        }
      }
    },
    ['body']
  )
)

export const workspaceIdValidator = validate(
  checkSchema(
    {
      workspace_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: WORKSPACES_MESSAGES.INVALID_WORKSPACE_ID
              })
            }

            const { user_id } = (req as Request).decoded_authorization as TokenPayload

            const queryConditions = [
              { _id: new ObjectId(value) },
              { _destroy: false },
              {
                'members.user_id': new ObjectId(user_id)
              }
            ]

            // Execute MongoDB aggregation pipeline to fetch workspace with related data
            const [workspace] = await databaseService.workspaces
              .aggregate<Workspace>([
                // Stage 1: $match - Filter documents based on query conditions
                // This stage finds the workspace by ID, ensures it's not destroyed,
                // and verifies the current user is a member of the workspace
                {
                  $match: { $and: queryConditions }
                },
                // Stage 2: $lookup - Join with boards collection
                // This performs a left outer join to fetch all boards associated with this workspace
                // localField: '_id' (workspace ID) matches foreignField: 'workspace_id' in boards collection
                {
                  $lookup: {
                    from: envConfig.dbBoardsCollection,
                    localField: '_id',
                    foreignField: 'workspace_id',
                    as: 'boards'
                  }
                },
                // Stage 3: $lookup - Join with users collection for member details
                // This fetches user information for all workspace members
                // Uses a sub-pipeline to exclude sensitive user data (passwords, tokens)
                {
                  $lookup: {
                    from: envConfig.dbUsersCollection,
                    localField: 'members.user_id', // Array of user IDs from workspace members
                    foreignField: '_id', // User document _id field
                    as: 'memberUsers', // Store results in temporary field
                    pipeline: [
                      {
                        // Sub-pipeline: $project - Exclude sensitive user fields
                        // This ensures passwords and security tokens are not returned
                        $project: {
                          password: 0,
                          email_verify_token: 0,
                          forgot_password_token: 0
                        }
                      }
                    ]
                  }
                },
                // Stage 4: $addFields - Transform and flatten member data structure
                // This stage restructures the members array to include user details directly
                {
                  $addFields: {
                    members: {
                      // $map - Transform each element in the members array
                      $map: {
                        input: '$members', // Process each member in the array
                        as: 'member', // Variable name for current member
                        in: {
                          // $let - Define variables for use in expression
                          $let: {
                            vars: {
                              // Find the corresponding user document for this member
                              user: {
                                // $arrayElemAt - Get the first element from filtered array
                                $arrayElemAt: [
                                  {
                                    // $filter - Find user document matching member's user_id
                                    $filter: {
                                      input: '$memberUsers', // Search in fetched user documents
                                      as: 'user', // Variable name for current user
                                      cond: {
                                        // $eq - Match user._id with member.user_id
                                        $eq: ['$$user._id', '$$member.user_id']
                                      }
                                    }
                                  },
                                  0 // Get first (and only) matching element
                                ]
                              }
                            },
                            in: {
                              // $mergeObjects - Combine member and user data into single object
                              $mergeObjects: [
                                {
                                  // $unsetField - Remove user_id field from member object
                                  // This prevents duplication since user._id will serve as identifier
                                  $unsetField: {
                                    field: 'user_id',
                                    input: '$$member'
                                  }
                                },
                                '$$user' // Merge all user fields into member object
                              ]
                            }
                          }
                        }
                      }
                    }
                  }
                },
                // Stage 5: $project - Clean up temporary fields
                // Remove the temporary 'memberUsers' field as it's no longer needed
                {
                  $project: { memberUsers: 0 }
                }
              ])
              .toArray()

            if (!workspace) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: WORKSPACES_MESSAGES.WORKSPACE_NOT_FOUND
              })
            }

            ;(req as Request).workspace = workspace

            return true
          }
        }
      }
    },
    ['params']
  )
)
