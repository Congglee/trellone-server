import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { pick } from 'lodash'
import { validate } from '~/utils/validation'

export type FilterKeys<T> = Array<keyof T>

// Filter middleware to filter out unwanted keys from request body
export const filterMiddleware =
  <T>(filterKeys: FilterKeys<T>) =>
  (req: Request, res: Response, next: NextFunction) => {
    req.body = pick(req.body, filterKeys)
    next()
  }

export const paginationValidator = validate(
  checkSchema(
    {
      limit: {
        isNumeric: true,
        custom: {
          options: async (value) => {
            const num = Number(value)

            if (num > 100 || num < 1) {
              throw new Error('1 <= limit <= 100')
            }

            return true
          }
        }
      },
      page: {
        isNumeric: true,
        custom: {
          options: async (value) => {
            const num = Number(value)

            if (num < 1) {
              throw new Error('page >= 100')
            }

            return true
          }
        }
      }
    },
    ['query']
  )
)
