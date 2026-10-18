import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright-core'

const root = resolve(import.meta.dirname, '..')
const expectBackend = process.argv.includes('--backend')
const port = 5190
const base = `http://127.0.0.1:${port}`
const server = spawn(
  process.execPath,
  [
    resolve(root, 'node_modules/vite/bin/vite.js'),
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
    '--strictPort',
  ],
  { cwd: root, stdio: 'pipe' },
)
let serverOutput = ''
server.stderr.on('data', (chunk) => {
  serverOutput += chunk.toString()
})
let browser

try {
  for (let i = 0; i < 100; i++) {
    if (server.exitCode != null) throw new Error(`Preview exited: ${serverOutput}`)
    try {
      if ((await fetch(`${base}/demo`)).ok) break
    } catch {
      /* starting */
    }
    if (i === 99) throw new Error(`Preview did not start: ${serverOutput}`)
    await delay(100)
  }
  const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  browser = await chromium.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`${base}/demo`)
  await page.getByRole('heading', { name: 'Research moves forward together.' }).waitFor()
  await page.getByRole('button', { name: 'Start session' }).click()
  if (expectBackend) await page.getByText('Saved session', { exact: true }).waitFor()
  await page.getByRole('button', { name: /Human judgment/ }).click()
  await page.getByLabel('Human guidance weight').fill('0')
  assert.equal(await page.locator('.demo-score-row.winner').count(), 1)
  assert.match(await page.locator('.demo-score-row.winner').innerText(), /Appearance-first/)
  await page.getByLabel('Human guidance weight').fill('1')
  assert.match(await page.locator('.demo-score-row.winner').innerText(), /Geometry-first/)
  await page.getByLabel('Scientific guidance').fill('Prioritize geometric consistency.')
  await page.getByRole('button', { name: 'Record guidance' }).click()
  await page.getByText('Prioritize geometric consistency.', { exact: true }).waitFor()
  if (expectBackend) {
    await page.getByText(/Human checkpoint and guidance weight saved/).waitFor()
    const sessions = await (await fetch(`${base}/api/v1/research-sessions`)).json()
    const detail = await (await fetch(`${base}/api/v1/research-sessions/${sessions[0].id}`)).json()
    assert.equal(detail.checkpoints[0].answer, 'Prioritize geometric consistency.')
    assert.equal(detail.checkpoints[0].guidance_weight, 1)
    await page.reload()
    await page.locator('.demo-recent-sessions button').first().click()
    await page.locator('.demo-saved-events').getByText('Human: Prioritize geometric consistency.').waitFor()
  }
  await page.getByRole('button', { name: /Papiers & corpus/ }).click()
  await page.getByText('Papiers library').waitFor()
  await page.locator('.demo-systems summary').click()
  assert.equal(await page.locator('.demo-systems-grid button').count(), 16)
  await page.getByLabel('RESEARCH GOAL').fill('Explore battery chemistry with a controlled experiment.')
  await page.getByRole('button', { name: 'Start session' }).click()
  assert.equal(
    await page.locator('.demo-overview strong').first().textContent(),
    'Explore battery chemistry with a controlled experiment.',
  )
  assert.equal(await page.getByText('Awaiting goal-specific data').count(), 1)
  assert.deepEqual(errors, [])
  await mkdir(resolve(root, 'artifacts'), { recursive: true })
  await page.screenshot({ path: resolve(root, 'artifacts/demo.png'), fullPage: true })
  console.log(
    'Research demo smoke passed: stages navigate, CFG ranking changes, guidance records, and corpus status renders.',
  )
} finally {
  await browser?.close()
  server.kill()
}
