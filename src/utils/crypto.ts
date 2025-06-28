import { createHash } from 'crypto'
import { envConfig } from '~/config/environment'

const sha256 = (content: string) => createHash('sha256').update(content).digest('hex')

export const hashPassword = (password: string): string => sha256(password + envConfig.passwordSecret)
