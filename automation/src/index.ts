import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/results', async (c) => {
  return c.json({ message: 'Hello Hono!' })
})

export default app
