import { CorsOptions } from 'cors'
import { environment } from '~/config/environment'
import { WHITELIST_DOMAINS } from '~/constants/domains'
import HTTP_STATUS from '~/constants/httpStatus'

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true)
    }

    if (environment === 'development') {
      return callback(null, true)
    }

    if (WHITELIST_DOMAINS.includes(origin as string)) {
      return callback(null, true)
    }

    return callback(
      Object.assign(new Error(`The domain ${origin} is not allowed to access this resource`), {
        status: HTTP_STATUS.FORBIDDEN
      })
    )
  },
  optionsSuccessStatus: 200,
  credentials: true
}
