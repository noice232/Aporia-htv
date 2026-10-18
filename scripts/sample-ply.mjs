import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const source = resolve(root, '.local-scenes/scene.ply')
const output = resolve(root, '.local-scenes/scene-sample.ply')
const step = Number(process.argv[2] || 8)
if (!Number.isInteger(step) || step < 2) throw new Error('Sample step must be an integer of at least 2.')

const input = await readFile(source)
const headerEnd = input.indexOf(Buffer.from('end_header\n')) + 'end_header\n'.length
if (headerEnd < 'end_header\n'.length) throw new Error('PLY header is missing.')
const header = input.subarray(0, headerEnd).toString('ascii')
if (!header.includes('format binary_little_endian 1.0'))
  throw new Error('Only binary little-endian PLY is supported.')
const vertexMatch = header.match(/^element vertex (\d+)$/m)
if (!vertexMatch) throw new Error('PLY vertex count is missing.')
const originalCount = Number(vertexMatch[1])
const vertexSection = header.split(/^element vertex \d+\r?\n/m)[1]?.split(/^element /m)[0]
if (!vertexSection) throw new Error('PLY vertex properties are missing.')
const byteSizes = { char: 1, uchar: 1, short: 2, ushort: 2, int: 4, uint: 4, float: 4, double: 8 }
let stride = 0
for (const line of vertexSection.split(/\r?\n/)) {
  if (!line.startsWith('property ')) continue
  const [, type] = line.split(' ')
  if (!byteSizes[type]) throw new Error(`Unsupported vertex property type: ${type}`)
  stride += byteSizes[type]
}
const count = Math.ceil(originalCount / step)
const outputHeader = Buffer.from(header.replace(/^element vertex \d+$/m, `element vertex ${count}`), 'ascii')
const vertexEnd = headerEnd + originalCount * stride
if (vertexEnd > input.length) throw new Error('PLY vertex data is truncated.')
const sampled = Buffer.allocUnsafe(count * stride)
for (let index = 0; index < count; index++) {
  input.copy(
    sampled,
    index * stride,
    headerEnd + index * step * stride,
    headerEnd + (index * step + 1) * stride,
  )
}
await writeFile(output, Buffer.concat([outputHeader, sampled, input.subarray(vertexEnd)]))
console.log(`Wrote ${count} of ${originalCount} real Gaussian records to ${output}`)
