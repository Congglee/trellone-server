// Libraries import
import express from 'express'

const app = express()

// Enable JSON parsing for request bodies
app.use(express.json())

app.use('/', (req, res) => {
  res.send('Hello World!')
})

export default app
