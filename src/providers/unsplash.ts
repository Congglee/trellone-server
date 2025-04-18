import { createApi } from 'unsplash-js'
import { envConfig } from '~/config/environment'

const unsplash = createApi({
  accessKey: envConfig.unsplashAccessKey
})

export const getSearchPhotosFromUnsplash = async (query: string, page: number = 1, perPage: number = 30) => {
  const getSearchPhotosRes = await unsplash.search.getPhotos({
    query,
    page,
    perPage,
    orientation: 'landscape'
  })

  return getSearchPhotosRes
}
