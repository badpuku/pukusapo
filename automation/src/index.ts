import { Hono } from 'hono'
import { Octokit } from 'octokit'
import type { ReservationResult } from '~/types'

type Bindings = {
  GITHUB_TOKEN: string
  GITHUB_REPO_OWNER: string
  GITHUB_REPO_NAME: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Reservation Collector API',
    endpoints: {
      'POST /jobs': 'Create a new collection job',
      'GET /jobs/:id': 'Get job status',
      'POST /reservations': 'Save collected reservations',
      'GET /reservations': 'Get reservations'
    }
  })
})

/**
 * 収集ジョブの作成
 */
app.post('/jobs', async (c) => {
  try {
    const octokit = new Octokit({
      auth: c.env.GITHUB_TOKEN
    })

    // workflow_dispatch イベントを発火
    const response = await octokit.rest.actions.createWorkflowDispatch({
      owner: c.env.GITHUB_REPO_OWNER,
      repo: c.env.GITHUB_REPO_NAME,
      workflow_id: 'collector.yml',
      ref: 'main', // または適切なブランチ名
      inputs: {
        environment: 'production'
      }
    })

    return c.json({
      success: true,
      message: 'Workflow triggered successfully',
      status: response.status
    }, 202) // 202 Accepted
  } catch (error: any) {
    console.error('Failed to trigger workflow:', error)
    return c.json({
      success: false,
      error: error.message
    }, 500)
  }
})

/**
 * ジョブ状態の取得
 */
app.get('/jobs/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const octokit = new Octokit({
    auth: c.env.GITHUB_TOKEN
  })
  const response = await octokit.rest.actions.getWorkflowRun({
    owner: c.env.GITHUB_REPO_OWNER,
    repo: c.env.GITHUB_REPO_NAME,
    run_id: id
  })
  return c.json({
    success: true,
    message: 'Workflow run status',
    status: response.status
  })
})

/**
 * 予約情報の保存
 */
app.post('/reservations', async (c) => {
  // TODO: 実際の保存ロジックを実装
  const body = await c.req.json<ReservationResult>()
  console.log('Received reservations:', JSON.stringify(body, null, 2))

  return c.json({
    success: true,
    message: 'Reservations saved'
  })
})

/**
 * 予約情報の取得
 */
app.get('/reservations', async (c) => {
  // TODO: 実際の取得ロジックを実装
  return c.json({
    success: true,
    message: 'Reservations fetched'
  })
})

export default app
