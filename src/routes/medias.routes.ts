import { Router } from 'express'
import {
  unsplashSearchGetPhotosController,
  uploadDocumentController,
  uploadImageController
} from '~/controllers/medias.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { unsplashSearchGetPhotosValidator } from '~/middlewares/medias.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const mediasRouter = Router()

mediasRouter.post('/upload-image', accessTokenValidator, wrapRequestHandler(uploadImageController))

mediasRouter.post('/upload-document', accessTokenValidator, wrapRequestHandler(uploadDocumentController))

mediasRouter.get(
  '/unsplash/search/get-photos',
  accessTokenValidator,
  unsplashSearchGetPhotosValidator,
  wrapRequestHandler(unsplashSearchGetPhotosController)
)

export default mediasRouter
