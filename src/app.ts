// Libraries import
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

// Routes import
import boardsRouter from '~/routes/boards.routes'
import columnsRouter from '~/routes/columns.routes'
import cardsRouter from '~/routes/cards.routes'
import authRouter from '~/routes/auth.routes'
import usersRouter from '~/routes/users.routes'
import mediasRouter from '~/routes/medias.routes'

// Middlewares import
import { defaultErrorHandler } from '~/middlewares/error.middlewares'
import { corsOptions } from '~/config/cors'

// Config import
import { initFolder } from '~/utils/file'

const app = express()

// Enable JSON parsing for request bodies
app.use(express.json())

// Use middleware
app.use(cookieParser())
app.use(cors(corsOptions))

// Initialize folders for file uploads
initFolder()

// Use app routes
app.use('/auth', authRouter)
app.use('/users', usersRouter)
app.use('/boards', boardsRouter)
app.use('/columns', columnsRouter)
app.use('/cards', cardsRouter)
app.use('/medias', mediasRouter)

// Error handling middleware
app.use(defaultErrorHandler)

export default app
