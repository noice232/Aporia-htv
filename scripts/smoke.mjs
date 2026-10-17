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
const makeEvent = (sequence, type) => ({
  id: `event-${sequence}`,
  sequence,
  type,
  entity_id: null,
  payload: null,
  data_mode: 'demo_fixture',
  occurred_at: iso,
})
const events = [
  makeEvent(1, 'project.created'),
  makeEvent(2, 'goal.evaluated'),
  makeEvent(3, 'principle.approved'),
]
let created = false
let goalSubmitted = false
let approved = false
let principle = null
let fork = null
const scoreBodies = []
const url = (path) => `/api/v1${path}`

function policy(w) {
  const a = {
    candidate_id: 'A',
    label: 'Experiment A · appearance',
    s_u: 0.8,
    s_c: 0.5,
    delta: -0.3,
    s_guided: w === 0 ? 0.8 : 0.5,
    feasible: true,
    infeasibility_reason: null,
    rubric_u: { rationale: 'Strong independent baseline' },
    rubric_c: { rationale: 'Lower geometry priority' },
  }
  const b = {
    candidate_id: 'B',
    label: 'Experiment B · geometry',
    s_u: 0.6,
    s_c: 0.9,
    delta: 0.3,
    s_guided: w === 0 ? 0.6 : 0.9,
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
    selected_candidate_id: w === 0 ? 'A' : 'B',
    selected_label: w === 0 ? a.label : b.label,
    scores: [a, b, f],
    status: 'scored',
    fallback_reason: null,
    computed_at: iso,
  }
}

function forkResult(w) {
  return {
    id: 'fork-1',
    project_id: project.id,
    checkpoint_snapshot_id: 'snapshot-1',
    w_unguided: 0,
    w_guided: w,
    branch_unguided: {
      candidate_id: 'A',
      candidate_label: 'Experiment A · appearance',
      run_id: 'run-a',
      coverage_fraction: 0.1667,
      visible_count: 1,
      total_count: 6,
      status: 'evaluated',
    },
    branch_guided: {
      candidate_id: 'B',
      candidate_label: 'Experiment B · geometry',
      run_id: 'run-b',
      coverage_fraction: 0.5,
      visible_count: 3,
      total_count: 6,
      status: 'evaluated',
    },
    comparison: {
      coverage_delta: 0.3333,
      winner: 'guided',
      status: 'complete',
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
    status = 201
    data = project
  } else if (path === url('/projects/project-demo/runs') && method === 'GET')
    data = goalSubmitted ? [run] : []
  else if (path === url('/projects/project-demo/goals') && method === 'POST') {
    goalSubmitted = true
    data = {
      project_id: project.id,
      runs: [run],
      best_coverage: 0.1667,
      threshold_met: false,
      agenda_item_id: null,
    }
  } else if (path === url('/projects/project-demo/agenda') && method === 'GET') data = []
  else if (path === url('/projects/project-demo/policy/score') && method === 'POST') {
    const body = request.postDataJSON()
    scoreBodies.push(body)
    assert.deepEqual(Object.keys(body), ['w'])
    data = policy(body.w)
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
    data = principle
  } else if (path === url('/projects/project-demo/principles/principle-1/approve') && method === 'POST') {
    approved = true
    principle = { ...principle, approved: true, approved_at: iso }
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
    data = fork
      ? [
          {
            id: fork.id,
            project_id: project.id,
            candidate_id_unguided: 'A',
            candidate_id_guided: 'B',
            w_guided: fork.w_guided,
            winner: 'guided',
            comparison_status: 'complete',
            created_at: iso,
          },
        ]
      : []
  else if (path === url('/projects/project-demo/forks') && method === 'POST') {
    status = 201
    fork = forkResult(request.postDataJSON().w)
    data = fork
  } else if (path === url('/projects/project-demo/forks/fork-1') && method === 'GET') data = fork
  else if (path === url('/projects/project-demo/events') && method === 'GET') {
    const after = Number(address.searchParams.get('after') || 0)
    data =
      after === 0
        ? { events: events.slice(0, 2), next_sequence: 2 }
        : { events: events.filter((item) => item.sequence > after), next_sequence: null }
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
  await page.getByRole('button', { name: /Create project/ }).click()
  await page.getByRole('button', { name: /Submit goal/ }).click()
  await page.locator('.selected-row .candidate-name').getByText('Experiment B · geometry').waitFor()
  assert.equal(created, true)
  assert.equal(goalSubmitted, true)
  assert.match(await page.locator('.infeasible-row').innerText(), /Exceeds experiment budget/)
  const slider = page.getByRole('slider', { name: 'Guidance weight w' })
  await slider.focus()
  await slider.press('Home')
  await page.locator('.selected-row .candidate-name').getByText('Experiment A · appearance').waitFor()
  for (let i = 0; i < 20; i++) await slider.press('ArrowRight')
  await page.locator('.selected-row .candidate-name').getByText('Experiment B · geometry').waitFor()
  assert.equal(await slider.inputValue(), '1')
  await mkdir(resolve(root, 'artifacts'), { recursive: true })
  await page.screenshot({ path: resolve(root, 'artifacts/judgments.png'), fullPage: true })

  await page.getByRole('button', { name: /Researcher profile/ }).click()
  await page.getByLabel('What should the agent consider?').fill('Favor geometric consistency.')
  await page.getByRole('button', { name: 'Submit judgment' }).click()
  await page.getByText('Pending approval').waitFor()
  await page.getByRole('button', { name: /^Approve/ }).click()
  await page.getByText('Version 3').waitFor()
  for (const version of ['v1', 'v2', 'v3'])
    await page.locator('.version-node').getByText(version, { exact: true }).waitFor()
  await page.screenshot({ path: resolve(root, 'artifacts/profile.png'), fullPage: true })

  await page.getByRole('button', { name: /Fork comparison/ }).click()
  await page.getByRole('button', { name: 'Create fork' }).click()
  await page.locator('.branch-panel').getByText('16.67%').waitFor()
  await page.locator('.branch-panel').getByText('50.00%').waitFor()
  await page.getByText('Small fixture sample').waitFor()
  await page.getByText('No confidence interval').waitFor()
  await page.screenshot({ path: resolve(root, 'artifacts/forks.png'), fullPage: true })

  await page.getByRole('button', { name: 'Event log', exact: true }).click()
  await page.getByRole('button', { name: /Load more after #2/ }).click()
  await page.getByText('principle · approved').first().waitFor()
  assert.equal(await page.locator('.event-row .mode-badge').count(), 3)
  await page.screenshot({ path: resolve(root, 'artifacts/events.png'), fullPage: true })
  assert.ok(scoreBodies.some((body) => body.w === 0))
  assert.ok(scoreBodies.some((body) => body.w === 1))
  assert.ok(scoreBodies.every((body) => Object.keys(body).length === 1 && 'w' in body))
  console.log(
    'PASS project → goal → policy A→B, infeasible F, pending → approved v1–v3, fork coverage, event cursor and mode badges',
  )
  console.log(`PASS ${scoreBodies.length} score requests contained only { w }`)
  console.log('Screenshots: artifacts/judgments.png, profile.png, forks.png, events.png')
} finally {
  await browser?.close()
  server.kill()
}
