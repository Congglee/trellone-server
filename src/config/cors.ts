import { CorsOptions } from 'cors'
import { environment } from '~/config/environment'
import { WHITELIST_DOMAINS } from '~/constants/domains'
import HTTP_STATUS from '~/constants/httpStatus'
import { ErrorWithStatus } from '~/models/Errors'

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (environment === 'development') {
      return callback(null, true)
    }

    if (WHITELIST_DOMAINS.includes(origin as string)) {
      return callback(null, true)
    }

    return callback(
      new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: `The domain ${origin} is not allowed to access this resource`
      })
    )
  },
  optionsSuccessStatus: 200,
  credentials: true
}
