import { envConfig } from '~/config/environment'

export const WHITELIST_DOMAINS: string[] = [
  // 'http://localhost:3000'
  envConfig.clientUrl,
  envConfig.googleRedirectUri
]
