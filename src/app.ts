// Libraries import
import express from 'express'
import { defaultErrorHandler } from '~/middlewares/error.middlewares'

// Routes import
import boardsRouter from '~/routes/boards.routes'

const app = express()

// Enable JSON parsing for request bodies
app.use(express.json())

// Use app routes
app.use('/boards', boardsRouter)

// Error handling middleware
app.use(defaultErrorHandler)

export default app
