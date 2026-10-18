import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { chromium } from 'playwright-core'

const root = resolve(import.meta.dirname, '..')
const port = 5188
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
let serverOutput = ''
server.stderr.on('data', (chunk) => {
  serverOutput += chunk.toString()
})
let browser
let page

try {
  for (let i = 0; i < 100; i++) {
    if (server.exitCode != null) throw new Error(`Vite exited: ${serverOutput}`)
    try {
      if ((await fetch(`${base}/poc`)).ok) break
    } catch {
      // Still starting.
    }
    if (i === 99) throw new Error(`Vite did not start: ${serverOutput}`)
    await delay(100)
  }

  const chrome = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  browser = await chromium.launch({
    executablePath: chrome,
    headless: true,
    args: [
      '--no-sandbox',
      '--enable-webgl',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
    ],
  })
  page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
  const browserErrors = []
  const consoleErrors = []
  page.on('pageerror', (error) => browserErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(`${message.location().url}: ${message.text()}`)
  })
  await page.goto(`${base}/poc`)
  await page
    .getByText('Scene ready', { exact: true })
    .waitFor({ timeout: 90000 })
    .catch(async (error) => {
      const visibleError = await page.locator('.poc-stage-message.error').textContent()
      throw new Error(
        `${error.message}\nViewer error: ${visibleError}\nBrowser errors: ${browserErrors.join(' | ')}\nConsole errors: ${consoleErrors.join(' | ')}`,
      )
    })
  assert.equal(await page.locator('.poc-splat-host canvas').count(), 1)
  console.log('Scene ready; canvas present.')
  await delay(1000)
  await page.getByRole('button', { name: 'Capture view' }).click()
  await page.getByAltText('Front view captured render').waitFor({ timeout: 30000 })
  const baseline = await page.getByAltText('Front view captured render').getAttribute('src')
  await page.getByRole('button', { name: /Left candidate/ }).click()
  await page.getByRole('button', { name: 'Capture view' }).click()
  await page.getByAltText('Left candidate captured render').waitFor({ timeout: 30000 })
  const capture = await page.getByAltText('Left candidate captured render').getAttribute('src')
  assert.ok(baseline?.startsWith('data:image/png;base64,') && baseline.length > 1000)
  assert.ok(capture?.startsWith('data:image/png;base64,') && capture.length > 1000)
  assert.notEqual(capture, baseline, 'Candidate camera render must differ from source view')
  const capturePixels = await page.evaluate(async (url) => {
    const image = new Image()
    image.src = url
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d')
    context.drawImage(image, 0, 0)
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data
    let visible = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > 8) visible++
    return { visible, pixels: canvas.width * canvas.height }
  }, capture)
  assert.ok(
    capturePixels.visible > capturePixels.pixels * 0.01,
    `Capture appears empty: ${JSON.stringify(capturePixels)}`,
  )
  const measuredOccupancy = await page.locator('.poc-occupancy strong').allTextContents()
  assert.equal(measuredOccupancy.length, 2)
  assert.ok(
    measuredOccupancy.every((value) => Number.parseFloat(value) > 1),
    `Expected measured image occupancy for both views: ${measuredOccupancy.join(', ')}`,
  )
  await page.getByText('This is a 2D framing proxy', { exact: false }).waitFor()
  await mkdir(resolve(root, 'artifacts'), { recursive: true })
  await writeFile(
    resolve(root, 'artifacts/poc-source-view.png'),
    Buffer.from(baseline.split(',')[1], 'base64'),
  )
  await writeFile(resolve(root, 'artifacts/poc-left-view.png'), Buffer.from(capture.split(',')[1], 'base64'))
  const maskLayer = page.getByLabel('Paint missing region mask')
  await maskLayer.scrollIntoViewIfNeeded()
  const maskBounds = await maskLayer.boundingBox()
  assert.ok(maskBounds)
  await page.mouse.move(maskBounds.x + maskBounds.width * 0.45, maskBounds.y + maskBounds.height * 0.45)
  await page.mouse.down()
  await page.mouse.move(maskBounds.x + maskBounds.width * 0.55, maskBounds.y + maskBounds.height * 0.55, {
    steps: 8,
  })
  await page.mouse.up()
  const paintedPixels = await maskLayer.evaluate((canvas) => {
    const context = canvas.getContext('2d')
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data
    let painted = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] > 8) painted++
    return painted
  })
  assert.ok(paintedPixels > 100, 'Painted mask should contain white pixels')
  const maskDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download mask' }).click()
  const downloadedMask = await maskDownload
  assert.equal(downloadedMask.suggestedFilename(), 'left-inpaint-mask.png')
  await downloadedMask.saveAs(resolve(root, 'artifacts/poc-left-inpaint-mask.png'))
  await page.getByPlaceholder(/prioritize unobserved geometry/).fill('Prioritize unobserved geometry.')
  await page.getByRole('button', { name: 'Record guidance' }).click()
  await page.getByText('Prioritize unobserved geometry.', { exact: true }).waitFor()
  assert.deepEqual(browserErrors, [])
  assert.deepEqual(
    consoleErrors.filter(
      (error) => !error.includes('/api/v1/papiers/status') && !error.includes('favicon.ico'),
    ),
    [],
  )
  await mkdir(resolve(root, 'artifacts'), { recursive: true })
  await page.screenshot({ path: resolve(root, 'artifacts/poc.png'), fullPage: true })
  await page
    .locator('.poc-inspector input[type="file"]')
    .setInputFiles(resolve(root, '.local-scenes/scene-sample.ply'))
  await page.getByText('Loading splats', { exact: true }).waitFor({ timeout: 10000 })
  await page.getByText('Scene ready', { exact: true }).waitFor({ timeout: 90000 })
  assert.equal(await page.locator('.poc-splat-host canvas').count(), 1)
  console.log(
    `PoC browser smoke passed: scene rendered, camera moved, capture saved (${capturePixels.visible} visible pixels), guidance recorded, local scene replacement loaded.`,
  )
} finally {
  if (page) {
    await mkdir(resolve(root, 'artifacts'), { recursive: true })
    await page
      .screenshot({ path: resolve(root, 'artifacts/poc-last-run.png'), fullPage: true })
      .catch(() => {})
  }
  await browser?.close()
  server.kill()
}
