import { envConfig } from '~/config/environment'

export const WHITELIST_DOMAINS: string[] = [envConfig.clientUrl, envConfig.clientDevUrl, envConfig.googleRedirectUri]
