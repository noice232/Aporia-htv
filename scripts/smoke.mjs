import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright-core'

const root = resolve(import.meta.dirname, '..')
const port = 5187
const base = `http://127.0.0.1:${port}`
const server = spawn(
  process.execPath,
  [
    resolve(root, 'node_modules/vite/bin/vite.js'),
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '--strictPort',
  ],
  { cwd: root, stdio: 'pipe' },
)
let browser
let serverOutput = ''
server.stderr.on('data', (chunk) => {
  serverOutput += chunk.toString()
})

async function ready() {
  for (let i = 0; i < 50; i++) {
    if (server.exitCode != null) throw new Error(`Vite exited: ${serverOutput}`)
    try {
      if ((await fetch(base)).ok) return
    } catch {
      /* still starting */
    }
    await delay(100)
  }
  throw new Error(`Vite did not start: ${serverOutput}`)
}

const iso = '2026-10-17T12:00:00Z'
const project = {
  id: 'project-demo',
  title: 'Scene completion',
  objective: 'Improve geometry',
  status: 'active',
  created_at: iso,
}
const run = {
  id: 'run-1',
  evaluator_version: 'fixture-evaluator',
  seed: 42,
  status: 'completed',
  coverage_fraction: 0.1667,
}
const makeEvent = (sequence, type, entityId = null) => ({
  id: `event-${sequence}`,
  sequence,
  type,
  entity_id: entityId,
  payload: null,
  data_mode: 'measured',
  occurred_at: iso,
})
const events = []
function addEvent(type, entityId = null) {
  events.push(makeEvent(events.length + 1, type, entityId))
}
let created = false
let goalSubmitted = false
let approved = false
let principle = null
let fork = null
let forkCount = 0
const forkHistory = []
const scoreBodies = []
const forkBodies = []
let healthUnavailable = false
const failOnce = {
  project: true,
  runs: true,
  goal: true,
  score: true,
  judgment: true,
  approve: true,
  fork: true,
}
const url = (path) => `/api/v1${path}`

function policy(w) {
  const inert = !approved
  const a = {
    candidate_id: 'A',
    label: 'Experiment A · appearance',
    s_u: 0.8,
    s_c: inert ? 0.8 : 0.5,
    delta: inert ? 0 : -0.3,
    s_guided: inert || w === 0 ? 0.8 : 0.5,
    feasible: true,
    infeasibility_reason: null,
    rubric_u: { rationale: 'Strong independent baseline' },
    rubric_c: { rationale: 'Lower geometry priority' },
  }
  const b = {
    candidate_id: 'B',
    label: 'Experiment B · geometry',
    s_u: 0.6,
    s_c: inert ? 0.6 : 0.9,
    delta: inert ? 0 : 0.3,
    s_guided: inert || w === 0 ? 0.6 : 0.9,
    feasible: true,
    infeasibility_reason: null,
    rubric_u: { rationale: 'Moderate baseline' },
    rubric_c: { rationale: 'Favors geometric consistency' },
  }
  const f = {
    candidate_id: 'F',
    label: 'Experiment F · blocked',
    s_u: null,
    s_c: null,
    delta: null,
    s_guided: null,
    feasible: false,
    infeasibility_reason: 'Exceeds experiment budget',
    rubric_u: null,
    rubric_c: null,
  }
  return {
    id: `policy-${w}`,
    snapshot_id: 'snapshot-1',
    project_id: project.id,
    w,
    selected_candidate_id: inert || w === 0 ? 'A' : 'B',
    selected_label: inert || w === 0 ? a.label : b.label,
    scores: [a, b, f],
    status: inert ? 'unguided_only' : 'scored',
    fallback_reason: inert ? 'no_human_context' : null,
    computed_at: iso,
  }
}

function forkResult(w, sequence) {
  const state = sequence === 1 ? 'complete' : sequence === 2 ? 'partial' : 'pending'
  const guidedEvaluated = state === 'complete'
  const independentEvaluated = state !== 'pending'
  return {
    id: `fork-${sequence}`,
    project_id: project.id,
    checkpoint_snapshot_id: 'snapshot-1',
    w_unguided: 0,
    w_guided: w,
    branch_unguided: {
      candidate_id: 'A',
      candidate_label: 'Experiment A · appearance',
      run_id: 'run-a',
      coverage_fraction: independentEvaluated ? 0.1667 : null,
      visible_count: 1,
      total_count: 6,
      status: independentEvaluated ? 'evaluated' : 'not_evaluated',
    },
    branch_guided: {
      candidate_id: 'B',
      candidate_label: 'Experiment B · geometry',
      run_id: 'run-b',
      coverage_fraction: guidedEvaluated ? 0.5 : null,
      visible_count: 3,
      total_count: 6,
      status: guidedEvaluated ? 'evaluated' : 'not_evaluated',
    },
    comparison: {
      coverage_delta: guidedEvaluated ? 0.3333 : null,
      winner: guidedEvaluated ? 'guided' : null,
      status: state,
      confounds: ['Small fixture sample'],
      limitations: ['No confidence interval'],
    },
    shared_evaluator_version: 'fixture-evaluator',
    shared_dataset_hash: 'fixture-dataset',
    shared_budget: 'equal',
    created_at: iso,
  }
}

async function respond(route) {
  const request = route.request()
  const address = new URL(request.url())
  const path = address.pathname
  const method = request.method()
  const action =
    method === 'GET' && path === url('/projects/project-demo/runs')
      ? 'runs'
      : method !== 'POST'
        ? null
        : path === url('/projects')
          ? 'project'
          : path === url('/projects/project-demo/goals')
            ? 'goal'
            : path === url('/projects/project-demo/policy/score')
              ? 'score'
              : path === url('/projects/project-demo/judgments')
                ? 'judgment'
                : path === url('/projects/project-demo/principles/principle-1/approve')
                  ? 'approve'
                  : path === url('/projects/project-demo/forks')
                    ? 'fork'
                    : null
  if (action === 'score') {
    const body = request.postDataJSON()
    scoreBodies.push(body)
    assert.deepEqual(Object.keys(body), ['w'])
  }
  if (action === 'fork') forkBodies.push(request.postDataJSON())
  if (action && failOnce[action]) {
    failOnce[action] = false
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'TEMPORARY', message: `Temporary ${action} failure` }),
    })
    return
  }
  if (path === url('/health') && method === 'GET' && healthUnavailable) {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'OFFLINE', message: 'Health unavailable' }),
    })
    return
  }
  let data
  let status = 200
  if (path === url('/health') && method === 'GET')
    data = {
      status: 'ok',
      api_version: '1.0.0',
      providers: [
        {
          provider: 'fixture-provider',
          connected: true,
          mode: 'demo_fixture',
          model_id: null,
          checked_at: iso,
          last_error: null,
        },
      ],
      database_mode: 'demo_fixture',
      last_event_sequence: 3,
    }
  else if (path === url('/projects') && method === 'POST') {
    created = true
    addEvent('project.created', project.id)
    status = 201
    data = project
  } else if (path === url('/projects/project-demo/runs') && method === 'GET')
    data = goalSubmitted ? [run] : []
  else if (path === url('/projects/project-demo/goals') && method === 'POST') {
    goalSubmitted = true
    addEvent('run.completed', run.id)
    addEvent('goal.evaluated', project.id)
    data = {
      project_id: project.id,
      runs: [run],
      best_coverage: 0.1667,
      threshold_met: false,
      agenda_item_id: null,
    }
  } else if (path === url('/projects/project-demo/agenda') && method === 'GET') data = []
  else if (path === url('/projects/project-demo/policy/score') && method === 'POST') {
    data = policy(request.postDataJSON().w)
    addEvent('policy.scored', data.id)
  } else if (path === url('/projects/project-demo/principles') && method === 'GET')
    data = principle ? [principle] : []
  else if (path === url('/projects/project-demo/judgments') && method === 'POST') {
    status = 201
    principle = {
      id: 'principle-1',
      text: request.postDataJSON().text,
      source: 'human',
      scope: 'project',
      confidence: 1,
      enabled: true,
      approved: false,
      approved_at: null,
      weight_adjustments: {},
      created_at: iso,
    }
    addEvent('judgment.submitted', principle.id)
    data = principle
  } else if (path === url('/projects/project-demo/principles/principle-1/approve') && method === 'POST') {
    approved = true
    principle = { ...principle, approved: true, approved_at: iso }
    addEvent('principle.approved', principle.id)
    data = principle
  } else if (path === url('/projects/project-demo/profile') && method === 'GET')
    data = {
      id: 'profile-1',
      project_id: project.id,
      version: approved ? 3 : 1,
      principles: principle?.approved ? [principle] : [],
      scoring_weights: {},
    }
  else if (path === url('/projects/project-demo/profile/history') && method === 'GET')
    data = (approved ? [1, 2, 3] : [1]).map((version) => ({
      version,
      principles_snapshot: version > 1 && principle ? [principle] : [],
      created_at: iso,
    }))
  else if (path === url('/projects/project-demo/forks') && method === 'GET')
    data = forkHistory.map((item) => ({
      id: item.id,
      project_id: project.id,
      candidate_id_unguided: 'A',
      candidate_id_guided: 'B',
      w_guided: item.w_guided,
      winner: item.comparison.winner,
      comparison_status: item.comparison.status,
      created_at: iso,
    }))
  else if (path === url('/projects/project-demo/forks') && method === 'POST') {
    status = 201
    forkCount++
    fork = forkResult(request.postDataJSON().w, forkCount)
    forkHistory.push(fork)
    addEvent('fork.created', fork.id)
    data = fork
  } else if (path.startsWith(url('/projects/project-demo/forks/fork-')) && method === 'GET')
    data = forkHistory.find((item) => path.endsWith(item.id))
  else if (path === url('/projects/project-demo/events') && method === 'GET') {
    const after = Number(address.searchParams.get('after') || 0)
    const page = events.filter((item) => item.sequence > after).slice(0, 10)
    data = {
      events: page,
      next_sequence: events.some((item) => item.sequence > (page.at(-1)?.sequence ?? after))
        ? page.at(-1).sequence
        : null,
    }
  } else {
    status = 404
    data = { code: 'NOT_FOUND', message: `${method} ${path} was not part of the smoke fixture` }
  }
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(data) })
}

try {
  await ready()
  const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  await page.route('**/api/v1/**', respond)
  await page.goto(base)
  await mkdir(resolve(root, 'artifacts'), { recursive: true })
  await page.getByRole('button', { name: /Create project/ }).click()
  await page.getByText('Temporary project failure').waitFor()
  await page.getByRole('button', { name: 'Retry create project' }).click()
  await page.getByText('Project created. Set a coverage goal to begin the research flow.').waitFor()
  await page.getByText('Temporary runs failure').waitFor()
  await page.getByRole('button', { name: 'Retry loading project' }).click()
  await page.getByRole('button', { name: /Submit goal/ }).click()
  await page.getByText('Temporary goal failure').waitFor()
  await page.getByRole('button', { name: 'Retry goal' }).click()
  await page.getByRole('heading', { name: 'Teach the policy what matters.' }).waitFor()
  assert.equal(created, true)
  assert.equal(goalSubmitted, true)
  await page.locator('.nav-item').getByText('Judgments').click()
  await page.getByText(/Scoring failed: Temporary score failure/).waitFor()
  await page.getByRole('button', { name: 'Retry score' }).click()
  await page.getByText(/Guidance inert — no approved principles yet/).waitFor()
  assert.equal(await page.getByRole('slider', { name: 'Guidance weight w' }).isDisabled(), true)
  await page.locator('.selected-row .candidate-name').getByText('Experiment A · appearance').waitFor()
  await page.screenshot({ path: resolve(root, 'artifacts/guidance-inert.png'), fullPage: true })
  await page.getByRole('button', { name: 'Open researcher profile' }).click()
  await page.getByLabel('What should the agent consider?').fill('Favor geometric consistency.')
  await page.getByRole('button', { name: 'Submit judgment' }).click()
  await page.getByText('Temporary judgment failure').waitFor()
  await page.getByRole('button', { name: 'Retry submission' }).click()
  await page.getByText('Pending approval').waitFor()
  await page.getByRole('button', { name: /^Approve/ }).click()
  await page.getByText('Temporary approve failure').waitFor()
  await page.getByRole('button', { name: 'Retry approval' }).click()
  await page.getByText('Version 3').waitFor()
  for (const version of ['v1', 'v2', 'v3'])
    await page.locator('.version-node').getByText(version, { exact: true }).waitFor()
  await page.screenshot({ path: resolve(root, 'artifacts/profile.png'), fullPage: true })
  await page.getByRole('button', { name: 'Compare decisions' }).click()
  await page.locator('.selected-row .candidate-name').getByText('Experiment B · geometry').waitFor()
  assert.match(await page.locator('.infeasible-row').innerText(), /Exceeds experiment budget/)
  const slider = page.getByRole('slider', { name: 'Guidance weight w' })
  assert.equal(await slider.isEnabled(), true)
  await slider.focus()
  await slider.press('Home')
  await page.locator('.selected-row .candidate-name').getByText('Experiment A · appearance').waitFor()
  for (let i = 0; i < 20; i++) await slider.press('ArrowRight')
  await page.locator('.selected-row .candidate-name').getByText('Experiment B · geometry').waitFor()
  assert.equal(await slider.inputValue(), '1')
  await page.locator('.insight-section').nth(0).getByText('Measured').waitFor()
  await page.locator('.insight-section').nth(1).getByText('Measured').waitFor()
  await page.screenshot({ path: resolve(root, 'artifacts/judgments.png'), fullPage: true })
  healthUnavailable = true
  await page.locator('.api-pill').click()
  await page.getByText(/Backend unreachable. Showing the last fetched project data/).waitFor()
  healthUnavailable = false
  await page.getByRole('button', { name: 'Retry connection' }).click()
  await page.locator('.api-pill').getByText('Backend ok').waitFor()
  await page.getByRole('button', { name: /Fork comparison/ }).click()
  await page.getByRole('button', { name: 'Create fork' }).click()
  await page.getByText('Temporary fork failure').waitFor()
  await page.locator('.fork-toolbar').getByRole('button', { name: 'Retry fork' }).click()
  assert.equal(forkBodies[0].idempotency_key, forkBodies[1].idempotency_key)
  await page.locator('.branch-panel').getByText('16.67%').waitFor()
  await page.locator('.branch-panel').getByText('50.00%').waitFor()
  await page.locator('.fork-delta').getByText('+33.33%').waitFor()
  await page.locator('.fork-verdict').getByText('Guided branch leads').waitFor()
  await page.getByText('Small fixture sample').waitFor()
  await page.getByText('No confidence interval').waitFor()
  await page.screenshot({ path: resolve(root, 'artifacts/forks.png'), fullPage: true })
  await page.getByRole('button', { name: 'Create fork' }).click()
  await page.locator('.fork-controls .status-badge').getByText('partial').waitFor()
  assert.equal(await page.locator('.branch-card.not-evaluated').count(), 1)
  await page.locator('.fork-verdict').getByText('Awaiting both branches').waitFor()
  await page.screenshot({ path: resolve(root, 'artifacts/fork-partial.png'), fullPage: true })
  await page.getByRole('button', { name: 'Create fork' }).click()
  await page.locator('.fork-controls .status-badge').getByText('pending').waitFor()
  assert.equal(await page.locator('.branch-card.not-evaluated').count(), 2)

  await page.locator('.nav-item').getByText('Event log').click()
  await page.getByRole('button', { name: /Load more after #10/ }).click()
  await page.getByText('principle · approved').first().waitFor()
  assert.equal(await page.locator('.event-row .mode-badge').count(), events.length)
  await page.screenshot({ path: resolve(root, 'artifacts/events.png'), fullPage: true })
  assert.ok(scoreBodies.some((body) => body.w === 0))
  assert.ok(scoreBodies.some((body) => body.w === 1))
  assert.ok(scoreBodies.every((body) => Object.keys(body).length === 1 && 'w' in body))
  console.log(
    'PASS action retries, profile-first flow, inert guidance, policy A→B, fork complete/partial/pending, event cursor and mode badges',
  )
  console.log(`PASS ${scoreBodies.length} score requests contained only { w }`)
  console.log(
    'Screenshots: artifacts/guidance-inert.png, profile.png, judgments.png, forks.png, fork-partial.png, events.png',
  )
} finally {
  await browser?.close()
  server.kill()
}
