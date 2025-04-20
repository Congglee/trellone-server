import { UTApi } from 'uploadthing/server'
import fs from 'fs'
import { envConfig } from '~/config/environment'

export const utapi = new UTApi({ token: envConfig.uploadthingToken })

export const uploadFileToUploadthing = async (filePath: string, fileName: string, mimeType: string) => {
  // Read the file as Buffer
  const buffer = fs.readFileSync(filePath)

  // Create a File from the buffer
  const file = new File([buffer], fileName, { type: mimeType })

  // Upload file
  const uploadRes = await utapi.uploadFiles([file])

  return uploadRes[0].data // Return the first (and only) result
}
