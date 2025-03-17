import { Router } from 'express'
import { createColumnController } from '~/controllers/columns.controllers'
import { createColumnValidator } from '~/middlewares/columns.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const columnsRouter = Router()

columnsRouter.post('/', createColumnValidator, wrapRequestHandler(createColumnController))

export default columnsRouter
