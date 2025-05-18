import { Request } from 'express'
import path from 'path'
import { UPLOAD_IMAGE_DIR } from '~/config/dir'
import { getNameFromFullname, handleUploadDocument, handleUploadImage } from '~/utils/file'
import sharp from 'sharp'
import { uploadFileToUploadthing } from '~/providers/uploadthing'
import fsPromise from 'fs/promises'
import { UploadedFileData } from 'uploadthing/types'
import { MediaType } from '~/constants/enums'
import { getSearchPhotosFromUnsplash } from '~/providers/unsplash'

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

  async uploadDocument(req: Request) {
    const mime = (await import('mime')).default
    const files = await handleUploadDocument(req)

    const result = await Promise.all(
      files.map(async (file) => {
        // Unlike images, documents might not need resizing or format conversion with sharp
        // Directly upload to UploadThing
        const uploadthingResult = await uploadFileToUploadthing(
          file.filepath,
          file.originalFilename || file.newFilename,
          mime.getType(file.filepath) || 'application/octet-stream' // Generic fallback MIME type
        )

        // Delete original file after upload
        await fsPromise.unlink(file.filepath)

        return {
          url: (uploadthingResult as UploadedFileData).ufsUrl,
          type: MediaType.Document,
          mime_type: mime.getType(file.filepath) || 'application/octet-stream',
          size: file.size,
          original_name: file.originalFilename || file.newFilename
        }
      })
    )
    return result
  }

  async unsplashSearchGetPhotos(query: string) {
    const searchPhotos = await getSearchPhotosFromUnsplash(query)
    const results = searchPhotos.response?.results

    return results
  }
}

const mediasService = new MediasService()

export default mediasService
