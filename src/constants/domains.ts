import { envConfig } from '~/config/environment'

export const WHITELIST_DOMAINS: string[] = [
  envConfig.clientUrl,
  envConfig.googleRedirectUri,
  'https://d362-2405-4802-1bde-e7e0-34b6-de4-ae66-d5b3.ngrok-free.app'
]
