import { Hono } from 'hono'
import { Octokit } from 'octokit'
import type { ReservationRequest } from '~/types'
import { createClient } from '@supabase/supabase-js'

type Bindings = {
  GITHUB_TOKEN: string
  GITHUB_REPO_OWNER: string
  GITHUB_REPO_NAME: string
  SUPABASE_URL: string
  SUPABASE_SECRET_KEY: string
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
      'GET /reservations': 'Get reservations',
      'GET /collection-jobs': 'Get collection job list'
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
  const body = await c.req.json<ReservationRequest>()
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY)

  // 1. 収集ジョブを作成
  const { data: job, error: jobError } = await supabase
    .from('collection_jobs')
    .insert({ status: 'running' })
    .select('id')
    .single()

  if (jobError || !job) {
    console.error('Failed to create collection job:', jobError)
    return c.json({ success: false, error: 'Failed to create collection job' }, 500)
  }

  let savedCount = 0
  const errors: string[] = []

  for (const result of body.reservations) {
    // 2. user_id から facility_account_id を取得
    const { data: account, error: accountError } = await supabase
      .from('facility_accounts')
      .select('id')
      .eq('user_id', result.accountId)
      .single()

    if (accountError || !account) {
      errors.push(`Account not found for user_id: ${result.accountId}`)
      continue
    }

    // 3. 予約情報を保存
    for (const reservation of result.reservations) {
      const { error } = await supabase
        .from('facility_reservations')
        .insert({
          collection_job_id: job.id,
          facility_account_id: account.id,
          facility_name: reservation.facilityName,
          reservation_date: reservation.date,
          reservation_time: reservation.time,
          status: reservation.status,
        })

      if (error) {
        errors.push(`Failed to save reservation: ${error.message}`)
      } else {
        savedCount++
      }
    }
  }

  // 4. ジョブステータスを更新
  const finalStatus = errors.length > 0 && savedCount === 0 ? 'failed' : 'completed'
  await supabase
    .from('collection_jobs')
    .update({ status: finalStatus })
    .eq('id', job.id)

  return c.json({
    success: true,
    jobId: job.id,
    count: savedCount,
    errors: errors.length > 0 ? errors : undefined
  })
})

/**
 * 予約情報の取得
 */
app.get('/reservations', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY)
  const jobIdParam = c.req.query('job_id')

  let jobId: number

  if (jobIdParam) {
    jobId = Number(jobIdParam)
  } else {
    // job_id が指定されていない場合は最新のジョブを取得
    const { data: latestJob, error: latestJobError } = await supabase
      .from('collection_jobs')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .single()

    if (latestJobError || !latestJob) {
      return c.json({ success: true, jobId: null, reservations: [] })
    }
    jobId = latestJob.id
  }

  // 予約情報を取得（facility_accounts と JOIN して user_id も取得）
  const { data: reservations, error } = await supabase
    .from('facility_reservations')
    .select(`
      id,
      facility_name,
      reservation_date,
      reservation_time,
      status,
      facility_accounts!inner(user_id)
    `)
    .eq('collection_job_id', jobId)

  if (error) {
    console.error('Failed to fetch reservations:', error)
    return c.json({ success: false, error: 'Failed to fetch reservations' }, 500)
  }

  const formattedReservations = reservations?.map((r: any) => ({
    accountId: r.facility_accounts.user_id,
    facilityName: r.facility_name,
    reservationDate: r.reservation_date,
    reservationTime: r.reservation_time,
    status: r.status
  })) || []

  return c.json({
    success: true,
    jobId,
    reservations: formattedReservations
  })
})

/**
 * 収集ジョブ一覧の取得
 */
app.get('/collection-jobs', async (c) => {
  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SECRET_KEY)

  const { data: jobs, error } = await supabase
    .from('collection_jobs')
    .select('id, collected_at, status')
    .order('id', { ascending: false })

  if (error) {
    console.error('Failed to fetch collection jobs:', error)
    return c.json({ success: false, error: 'Failed to fetch collection jobs' }, 500)
  }

  return c.json({
    success: true,
    jobs: jobs || []
  })
})

export default app
