import { Request } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR } from '~/config/dir'
import { getNameFromFullname, handleUploadImage } from '~/utils/file'
import sharp from 'sharp'
import { uploadFileToUploadthing } from '~/providers/uploadthing'
import fsPromise from 'fs/promises'
import { UploadedFileData } from 'uploadthing/types'
import { MediaType } from '~/constants/enums'

class MediasService {
  async uploadImage(req: Request) {
    const mime = (await import('mime')).default
    const files = await handleUploadImage(req)

    const result = await Promise.all(
      files.map(async (file) => {
        const newName = getNameFromFullname(file.newFilename)
        const newFullFileName = `${newName}.jpg`
        const newPath = path.resolve(UPLOAD_IMAGE_DIR, newFullFileName)

        // Process with sharp
        // sharp.cache(false) // Disable sharp cache to avoid memory issues
        await sharp(file.filepath).jpeg().toFile(newPath)

        // Upload to UploadThing in parallel
        const uploadthingResult = await uploadFileToUploadthing(
          file.filepath,
          file.originalFilename || file.newFilename,
          mime.getType(file.filepath) || 'image/jpeg'
        )

        await Promise.all([
          fsPromise.unlink(file.filepath), // Delete original file
          fsPromise.unlink(newPath) // Delete new file
        ])

        return {
          url: (uploadthingResult as UploadedFileData).ufsUrl,
          type: MediaType.Image
        }
      })
    )

    return result
  }
}

const mediasService = new MediasService()

export default mediasService
