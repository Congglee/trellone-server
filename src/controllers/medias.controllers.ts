import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { MEDIAS_MESSAGES } from '~/constants/messages'
import { UnsplashQuery } from '~/models/requests/Media.requests'
import mediasService from '~/services/medias.services'

export const uploadImageController = async (req: Request, res: Response) => {
  const result = await mediasService.uploadImage(req)
  return res.json({ message: MEDIAS_MESSAGES.UPLOAD_SUCCESS, result })
}

export const unsplashSearchGetPhotosController = async (
  req: Request<ParamsDictionary, any, any, UnsplashQuery>,
  res: Response
) => {
  const result = await mediasService.unsplashSearchGetPhotos(req.query.query)
  return res.json({ message: MEDIAS_MESSAGES.UNSPLASH_SEARCH_GET_PHOTOS_SUCCESS, result })
}
