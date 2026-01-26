import { Hono } from 'hono'

type Bindings = {
  MY_VAR: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.post('/results', async (c) => {
  return c.json({ success: true })
})

export default app
