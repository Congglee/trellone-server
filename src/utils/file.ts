import { UPLOAD_DOCUMENT_TEMP_DIR, UPLOAD_IMAGE_TEMP_DIR } from '~/config/dir'
import { File } from 'formidable'
import { Request } from 'express'
import fs from 'fs'

export const initFolder = () => {
  ;[UPLOAD_IMAGE_TEMP_DIR, UPLOAD_DOCUMENT_TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

export const handleUploadImage = async (req: Request) => {
  const formidable = (await import('formidable')).default

  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
    maxFiles: 4,
    keepExtensions: true,
    maxFileSize: 3000 * 1024, // 3MB
    maxTotalFileSize: 3000 * 1024 * 4, // 12MB
    filter: function ({ name, mimetype }) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))

      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }

      return valid
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }

      // eslint-disable-next-line no-extra-boolean-cast
      if (!Boolean(files.image)) {
        return reject(new Error('File is empty'))
      }

      resolve(files.image as File[])
    })
  })
}

export const handleUploadDocument = async (req: Request) => {
  const formidable = (await import('formidable')).default

  const form = formidable({
    uploadDir: UPLOAD_DOCUMENT_TEMP_DIR,
    maxFiles: 4,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxTotalFileSize: 10 * 1024 * 1024 * 4, // 40MB
    filter: function ({ name, mimetype }) {
      // Allow common document types and image types
      const allowedDocumentMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'text/plain',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
      ]

      const allowedImageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

      const allowedMimeTypes = [...allowedDocumentMimeTypes, ...allowedImageMimeTypes]

      const valid = name === 'document' && Boolean(mimetype && allowedMimeTypes.includes(mimetype))

      if (!valid) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.emit('error' as any, new Error('File type is not valid for documents or images') as any)
      }

      return valid
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }

      if (!files.document || files.document.length === 0) {
        return reject(new Error('Document file is empty'))
      }

      resolve(files.document as File[])
    })
  })
}

export const getNameFromFullname = (fullname: string) => {
  const namearr = fullname.split('.')
  namearr.pop()
  return namearr.join('')
}
