// Libraries import
import express from 'express'
import cors from 'cors'

// Routes import
import boardsRouter from '~/routes/boards.routes'

// Middlewares import
import { defaultErrorHandler } from '~/middlewares/error.middlewares'
import { corsOptions } from '~/config/cors'

const app = express()

// Enable JSON parsing for request bodies
app.use(express.json())

// Use middleware
app.use(cors(corsOptions))

// Use app routes
app.use('/boards', boardsRouter)

// Error handling middleware
app.use(defaultErrorHandler)

export default app
