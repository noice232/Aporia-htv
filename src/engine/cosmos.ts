export const TOPICS = [
  { name: 'Computer Vision', color: '#fc766b' },
  { name: 'Generative AI', color: '#ffc247' },
  { name: 'Language Models', color: '#49c9d3' },
  { name: 'Robotics', color: '#8fd95b' },
  { name: 'Machine Learning', color: '#da7edb' },
  { name: 'Systems', color: '#6598ff' },
  { name: 'Optimization', color: '#eaa16b' },
  { name: 'Theory', color: '#b7cf50' },
]

export interface AtlasNode {
  id: string
  x: number
  y: number
  z: number
  topic: number
  cluster: number
  size: number
  kind: string
  title: string
}

export interface AtlasLink {
  source: string
  target: string
  src: number
  dst: number
}

interface RibbonPath {
  from: number
  to: number
  c1: number[]
  c2: number[]
  theme: number
  alpha: number
}

function seeded(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export function createAtlas(seed = 42, density = 1) {
  const rand = seeded(seed), TAU = Math.PI * 2
  const gauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, rand()))) * Math.cos(TAU * rand())
  const points: AtlasNode[] = []
  const links: AtlasLink[] = []
  const cores = [
    { c: [-5.3, -3.0, 0.2], axes: [3.25, 1.45, 1.0], angle: -.5, count: 3600, topic: 0 },
    { c: [1.0, -1.0, 0], axes: [2.7, 2.65, 1.8], angle: .15, count: 4500, topic: 1 },
    { c: [1.4, 5.05, 0.5], axes: [1.1, 3.15, 1.1], angle: -.38, count: 3500, topic: 2 },
    { c: [7.2, -3.0, -0.4], axes: [2.3, 1.0, 1.1], angle: -.24, count: 2700, topic: 3 },
    { c: [-1.1, -6.75, 1.0], axes: [.75, 2.0, .9], angle: -.2, count: 1200, topic: 4 },
  ]
  const push = (x: number, y: number, z: number, topic: number, cluster: number, size: number, kind = 'paper') => {
    const id = points.length
    points.push({
      id: `paper-${id}`, x, y, z, topic, cluster, size, kind,
      title: `Research paper ${String(id + 1).padStart(5, '0')}`,
    })
    return id
  }
  const connect = (a: number, b: number) => {
    if (a !== b) links.push({ source: points[a].id, target: points[b].id, src: a, dst: b })
  }
  const communities: number[][] = []
  for (let k = 0; k < cores.length; k++) {
    const q = cores[k], indices: number[] = [], count = Math.round(q.count * density)
    const ca = Math.cos(q.angle), sa = Math.sin(q.angle)
    for (let j = 0; j < count; j++) {
      const gx = gauss(), gy = gauss(), gz = gauss()
      const fx = gx * q.axes[0], fy = gy * q.axes[1]
      const x = q.c[0] + fx * ca - fy * sa, y = q.c[1] + fx * sa + fy * ca
      const z = q.c[2] + gz * q.axes[2] + .18 * Math.sin(x * .65 + y * .3)
      const topic = rand() < .68 ? q.topic : Math.floor(rand() * TOPICS.length)
      indices.push(push(x, y, z, topic, k, .65 + rand() * 1.2))
    }
    communities.push(indices)
    for (let j = 1; j < indices.length; j++) {
      if (rand() < .47) connect(indices[j], indices[Math.max(0, j - Math.floor(rand() * Math.min(j, 140)) - 1)])
    }
  }
  for (let k = 0; k < 48; k++) {
    const theta = rand() * TAU, rr = 9 + rand() * 9.5, phi = (rand() - .5) * 1.3
    const c = [Math.cos(theta) * rr, Math.sin(theta) * rr * .80, Math.sin(phi) * rr * .64]
    const amount = Math.round((15 + Math.pow(rand(), 2) * 170) * density), ids: number[] = []
    const rad = .12 + rand() * .37, topic = Math.floor(rand() * TOPICS.length)
    for (let j = 0; j < amount; j++) {
      ids.push(push(c[0] + gauss() * rad, c[1] + gauss() * rad, c[2] + gauss() * rad,
        rand() < .78 ? topic : Math.floor(rand() * TOPICS.length), 5 + k, .65 + rand() * .95))
    }
    for (let j = 1; j < ids.length; j++) {
      if (rand() < .4) connect(ids[j], ids[Math.floor(rand() * j)])
    }
    communities.push(ids)
  }
  for (let i = 0; i < Math.round(3800 * density); i++) {
    const a = rand() * TAU, r = 11 + rand() * 9.5, h = (rand() - .5) * 11
    push(Math.cos(a) * r, Math.sin(a) * r * .8, h, Math.floor(rand() * TOPICS.length), 100 + i, .4 + rand() * .7, 'solo')
  }
  for (let k = 0; k < 90; k++) {
    const start = cores[Math.floor(rand() * cores.length)].c
    const end = points[communities[5 + Math.floor(rand() * 48)][0]]
    if (!end) continue
    const drift = [gauss() * 3, gauss() * 3, gauss() * 2.3]
    const n = Math.round((36 + rand() * 78) * density), strand: number[] = []
    const hue = Math.floor(rand() * TOPICS.length)
    for (let j = 0; j < n; j++) {
      const t = j / (n - 1), wobble = Math.sin(t * TAU * (1 + rand() * .3) + k) * Math.sin(Math.PI * t)
      const x = start[0] * (1 - t) + end.x * t + drift[0] * Math.sin(Math.PI * t) + .5 * wobble + gauss() * .10
      const y = start[1] * (1 - t) + end.y * t + drift[1] * Math.sin(Math.PI * t) + .4 * wobble + gauss() * .10
      const z = start[2] * (1 - t) + end.z * t + drift[2] * Math.sin(Math.PI * t) + gauss() * .14
      strand.push(push(x, y, z, rand() < .78 ? hue : Math.floor(rand() * TOPICS.length), 200 + k, .4 + rand() * .55, 'stream'))
      if (j > 0) connect(strand[j - 1], strand[j])
    }
  }
  return { points, links, topics: TOPICS, communities }
}

function rgba(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255]
}

const VERT = `#version 300 es
precision highp float;
in vec3 aPosition; in vec4 aColor; in float aSize; in float aTopic;
uniform vec2 uResolution; uniform float uYaw,uPitch,uZoom,uDpr,uGlow,uPoints;
uniform int uFilter;
out vec4 vColor; out float vShow;
void main(){
 float cy=cos(uYaw),sy=sin(uYaw),cp=cos(uPitch),sp=sin(uPitch);
 vec3 p=vec3(cy*aPosition.x+sy*aPosition.z,aPosition.y,-sy*aPosition.x+cy*aPosition.z);
 p=vec3(p.x,cp*p.y-sp*p.z,sp*p.y+cp*p.z);
 float perspective=34.0/(34.0-p.z*.52);
 float aspect=uResolution.x/uResolution.y;
 gl_Position=vec4(p.x*perspective*uZoom/(21.5*aspect),p.y*perspective*uZoom/21.5,0.0,1.0);
 gl_PointSize=max(1.5,aSize * uDpr * (uGlow>0.5?7.5:3.0)*pow(perspective,1.2)*pow(uZoom,.32));
 vShow=(uFilter<0||abs(aTopic-float(uFilter))<.1)?1.0:0.0;
 float depth=clamp(.85+.14*p.z/15.0,.42,1.0);
 vColor=vec4(aColor.rgb,aColor.a*depth);
}`

const FRAG = `#version 300 es
precision highp float;
in vec4 vColor; in float vShow;
uniform float uGlow,uPoints,uDark; out vec4 frag;
void main(){
 if(vShow<.5)discard;
 if(uPoints>.5){
 float r=length(gl_PointCoord-.5)*2.0;
 if(r>1.0)discard;
 float glowA=uDark>.5?.17:.14;
 float solidA=uDark>.5?.96:.94;
 float a=uGlow>.5 ? pow(1.0-r,1.6)*glowA : smoothstep(1.0,.25,r)*solidA;
 frag=vec4(vColor.rgb,a*vColor.a);
 } else {float la=uDark>.5?.13:.18; frag=vec4(vColor.rgb,vColor.a*la);}
}`

interface VAOData {
  vao: WebGLVertexArrayObject
  len: number
  mode: number
}

export interface CosmosControls {
  setFilter: (topic: number) => void
  togglePause: () => boolean
  toggleLinks: () => boolean
  toggleCurves: () => boolean
  resetView: () => void
  getStats: () => { points: number; links: number }
  destroy: () => void
}

export type PickCallback = (node: AtlasNode | null, x: number, y: number) => void

export interface ExternalData {
  nodes: AtlasNode[]
  links: AtlasLink[]
}

export interface CosmosOptions {
  onPick?: PickCallback
  onHover?: PickCallback
  externalData?: ExternalData
  dark?: boolean
}

export function initCosmos(
  canvas: HTMLCanvasElement,
  onPickOrOpts?: PickCallback | CosmosOptions,
  externalData?: ExternalData,
): CosmosControls | null {
  const opts: CosmosOptions = typeof onPickOrOpts === 'function'
    ? { onPick: onPickOrOpts, externalData }
    : (onPickOrOpts ?? {})
  const onPick = opts.onPick
  const onHover = opts.onHover
  const darkMode = opts.dark ?? false
  if (typeof onPickOrOpts !== 'function' && !onPickOrOpts) {
    // called with no opts — externalData stays from the parameter
  } else if (typeof onPickOrOpts !== 'function') {
    externalData = opts.externalData
  }
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: false })
  if (!gl) return null

  const CV_PAPERS = [
    'ImageNet Classification with Deep Convolutional Neural Networks',
    'Very Deep Convolutional Networks for Large-Scale Image Recognition',
    'Going Deeper with Convolutions',
    'Deep Residual Learning for Image Recognition',
    'Faster R-CNN: Towards Real-Time Object Detection',
    'You Only Look Once: Unified Real-Time Object Detection',
    'SSD: Single Shot MultiBox Detector',
    'Feature Pyramid Networks for Object Detection',
    'Mask R-CNN',
    'Generative Adversarial Networks',
    'Image Style Transfer Using Convolutional Neural Networks',
    'Spatial Transformer Networks',
    'U-Net: Convolutional Networks for Biomedical Image Segmentation',
    'An Image is Worth 16x16 Words: Transformers for Image Recognition',
    'DETR: End-to-End Object Detection with Transformers',
    'CLIP: Learning Transferable Visual Models from Natural Language',
    'Denoising Diffusion Probabilistic Models',
    'High-Resolution Image Synthesis with Latent Diffusion Models',
    'Segment Anything',
    'DINOv2: Learning Robust Visual Features without Supervision',
    'NeRF: Representing Scenes as Neural Radiance Fields',
    '3D Gaussian Splatting for Real-Time Radiance Field Rendering',
    'EfficientNet: Rethinking Model Scaling for CNNs',
    'MobileNets: Efficient CNNs for Mobile Vision Applications',
    'CycleGAN: Unpaired Image-to-Image Translation',
    'Batch Normalization: Accelerating Deep Network Training',
    'Dropout: A Simple Way to Prevent Overfitting',
    'DenseNet: Densely Connected Convolutional Networks',
    'ShuffleNet: An Efficient CNN for Mobile Devices',
    'YOLO9000: Better, Faster, Stronger',
  ]
  const atlas = externalData ? null : createAtlas(42, .87)
  const nodes = externalData ? externalData.nodes : atlas!.points
  if (!externalData) {
    let pi = 0
    for (let i = 0; i < nodes.length && pi < CV_PAPERS.length; i++) {
      if (nodes[i].topic === 0 && nodes[i].size > 1.2) {
        nodes[i].title = CV_PAPERS[pi++]
      }
    }
  }
  const edges = externalData ? externalData.links : atlas!.links
  const n = nodes.length
  const LIGHT_PALETTE = ['#d4382b', '#d49a1a', '#1a8fa3', '#3d9e1e', '#a83db8', '#3060cc', '#c46520', '#6db020']
  const colors = darkMode ? TOPICS.map(t => rgba(t.color)) : LIGHT_PALETTE.map(c => rgba(c))

  function compileShader(type: number, source: string) {
    const s = gl!.createShader(type)!
    gl!.shaderSource(s, source)
    gl!.compileShader(s)
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) throw new Error(gl!.getShaderInfoLog(s) || '')
    return s
  }

  const program = gl.createProgram()!
  gl.attachShader(program, compileShader(gl.VERTEX_SHADER, VERT))
  gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || '')
  gl.useProgram(program)

  const loc: Record<string, WebGLUniformLocation | null> = {}
  for (const k of ['uResolution', 'uYaw', 'uPitch', 'uZoom', 'uDpr', 'uGlow', 'uPoints', 'uFilter', 'uDark']) {
    loc[k] = gl.getUniformLocation(program, k)
  }

  const fields: [string, number][] = [['aPosition', 3], ['aColor', 4], ['aSize', 1], ['aTopic', 1]]

  function bufferVAO(data: Float32Array[], mode: number): VAOData {
    const vao = gl!.createVertexArray()!
    gl!.bindVertexArray(vao)
    for (let idx = 0; idx < fields.length; idx++) {
      const [name, count] = fields[idx]
      const b = gl!.createBuffer()!
      gl!.bindBuffer(gl!.ARRAY_BUFFER, b)
      gl!.bufferData(gl!.ARRAY_BUFFER, data[idx], gl!.STATIC_DRAW)
      const att = gl!.getAttribLocation(program, name)
      gl!.enableVertexAttribArray(att)
      gl!.vertexAttribPointer(att, count, gl!.FLOAT, false, 0, 0)
    }
    gl!.bindVertexArray(null)
    return { vao, len: data[0].length / 3, mode }
  }

  function pointBuffers(ids: number[]) {
    const a = new Float32Array(ids.length * 3)
    const b = new Float32Array(ids.length * 4)
    const c = new Float32Array(ids.length)
    const d = new Float32Array(ids.length)
    for (let k = 0; k < ids.length; k++) {
      const p = nodes[ids[k]], col = colors[p.topic]
      a.set([p.x, p.y, p.z], k * 3)
      b.set([...col, .76 + .24 * (p.size / 2)], k * 4)
      c[k] = p.size
      d[k] = p.topic
    }
    return [a, b, c, d]
  }

  const allIds = nodes.map((_, i) => i)
  const pVao = bufferVAO(pointBuffers(allIds), gl.POINTS)

  const clusterNodes: number[][] = Array.from({ length: 53 }, () => [])
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].cluster < 53) clusterNodes[nodes[i].cluster].push(i)
  }
  const centers = clusterNodes.map(ids => {
    let x = 0, y = 0, z = 0
    for (const i of ids) { x += nodes[i].x; y += nodes[i].y; z += nodes[i].z }
    return [x / ids.length, y / ids.length, z / ids.length]
  })

  const rr = seeded(1287)
  const ribbonPaths: RibbonPath[] = []
  const rgauss = () => Math.sqrt(-2 * Math.log(Math.max(1e-9, rr()))) * Math.cos(Math.PI * 2 * rr())
  for (let group = 0; group < 106; group++) {
    let a: number, b: number
    if (group < 22) { a = Math.floor(rr() * 5); b = (a + 1 + Math.floor(rr() * 4)) % 5 }
    else if (group < 95) { a = Math.floor(rr() * 5); b = 5 + Math.floor(rr() * 48) }
    else { a = 5 + Math.floor(rr() * 48); b = 5 + Math.floor(rr() * 48); if (a === b) b = 5 + (b - 4) % 48 }
    const ca = centers[a], cb = centers[b]
    const dx = cb[0] - ca[0], dy = cb[1] - ca[1], dz = cb[2] - ca[2]
    const length = Math.hypot(dx, dy, dz)
    const side = (rr() - .5) * 2, bend = length * (.17 + rr() * .30) * side
    const dxy = Math.max(.001, Math.hypot(dx, dy))
    const c1 = [ca[0] + dx * .23 - dy / dxy * bend, ca[1] + dy * .23 + dx / dxy * bend, ca[2] + dz * .23 + bend * .40]
    const c2 = [ca[0] + dx * .75 - dy / dxy * bend * .86, ca[1] + dy * .75 + dx / dxy * bend * .86, ca[2] + dz * .75 + bend * .65]
    const count = group < 22 ? Math.round(37 + rr() * 66) : group < 95 ? Math.round(11 + rr() * 29) : Math.round(5 + rr() * 15)
    const theme = rr() < .68 ? 1 : Math.floor(rr() * colors.length)
    for (let j = 0; j < count; j++) {
      const from = clusterNodes[a][Math.floor(rr() * clusterNodes[a].length)]
      const to = clusterNodes[b][Math.floor(rr() * clusterNodes[b].length)]
      const variation = group < 22 ? .20 : .11
      const c1j = [c1[0] + rgauss() * variation, c1[1] + rgauss() * variation, c1[2] + rgauss() * variation]
      const c2j = [c2[0] + rgauss() * variation, c2[1] + rgauss() * variation, c2[2] + rgauss() * variation]
      ribbonPaths.push({ from, to, c1: c1j, c2: c2j, theme, alpha: .26 + rr() * .47 })
    }
  }

  function cubic(p0: number[], p1: number[], p2: number[], p3: number[], t: number) {
    const u = 1 - t, aa = u * u * u, bb = 3 * u * u * t, cc = 3 * u * t * t, dd = t * t * t
    return [
      aa * p0[0] + bb * p1[0] + cc * p2[0] + dd * p3[0],
      aa * p0[1] + bb * p1[1] + cc * p2[1] + dd * p3[1],
      aa * p0[2] + bb * p1[2] + cc * p2[2] + dd * p3[2],
    ]
  }

  let curveMode = true

  function linkBuffers(filter: number) {
    const a: number[] = [], b: number[] = [], c: number[] = [], d: number[] = []
    function vert(pos: number[], col: number[], alpha: number, topic: number) {
      a.push(pos[0], pos[1], pos[2]); b.push(col[0], col[1], col[2], alpha); c.push(1); d.push(topic)
    }
    function segment(p: number[], q: number[], col: number[], alpha: number, topic: number) {
      vert(p, col, alpha, topic); vert(q, col, alpha, topic)
    }
    for (let k = 0; k < edges.length; k += 3) {
      const e = edges[k], x = nodes[e.src], y = nodes[e.dst]
      if (filter >= 0 && (x.topic !== filter || y.topic !== filter)) continue
      const p = [x.x, x.y, x.z], q = [y.x, y.y, y.z]
      if (!curveMode) { segment(p, q, colors[x.topic], .20, x.topic); continue }
      const dist = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2])
      const mid = [(p[0] + q[0]) * .5 + (q[1] - p[1]) * .05, (p[1] + q[1]) * .5 - (q[0] - p[0]) * .05, (p[2] + q[2]) * .5 + dist * .05]
      let prior = p
      for (let j = 1; j <= 5; j++) {
        const t = j / 5, u = 1 - t
        const next = [u * u * p[0] + 2 * u * t * mid[0] + t * t * q[0], u * u * p[1] + 2 * u * t * mid[1] + t * t * q[1], u * u * p[2] + 2 * u * t * mid[2] + t * t * q[2]]
        segment(prior, next, colors[x.topic], .17, x.topic); prior = next
      }
    }
    for (const path of ribbonPaths) {
      const src = nodes[path.from], dst = nodes[path.to]
      if (filter >= 0 && (src.topic !== filter || dst.topic !== filter)) continue
      const p0 = [src.x, src.y, src.z], p3 = [dst.x, dst.y, dst.z], col = colors[path.theme]
      if (!curveMode) { segment(p0, p3, col, path.alpha * .46, src.topic); continue }
      let last = p0
      for (let step = 1; step <= 25; step++) {
        const next = cubic(p0, path.c1, path.c2, p3, step / 25)
        segment(last, next, col, path.alpha, src.topic); last = next
      }
    }
    return [new Float32Array(a), new Float32Array(b), new Float32Array(c), new Float32Array(d)]
  }

  let activeLinks = bufferVAO(linkBuffers(-1), gl.LINES)
  let filter = -1
  let linksVisible = true
  let paused = false
  let destroyed = false

  function replaceLinks() {
    gl!.deleteVertexArray(activeLinks.vao)
    activeLinks = bufferVAO(linkBuffers(filter), gl!.LINES)
  }

  const initial = { yaw: .06, pitch: -.1, zoom: 2.4 }
  let yaw = initial.yaw, pitch = initial.pitch, zoom = initial.zoom
  let dragging = false, moved = false, lastX = 0, lastY = 0, dpr = 1

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2)
    const w = Math.max(2, Math.floor(canvas.clientWidth * dpr))
    const h = Math.max(2, Math.floor(canvas.clientHeight * dpr))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h
      gl!.viewport(0, 0, w, h)
    }
  }

  function draw() {
    resize()
    const bg = darkMode ? [10 / 255, 13 / 255, 20 / 255] : [240 / 255, 236 / 255, 228 / 255]
    gl!.clearColor(bg[0], bg[1], bg[2], 1)
    gl!.clear(gl!.COLOR_BUFFER_BIT)
    gl!.enable(gl!.BLEND)
    gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA)
    gl!.uniform2f(loc.uResolution!, canvas.width, canvas.height)
    gl!.uniform1f(loc.uYaw!, yaw)
    gl!.uniform1f(loc.uPitch!, pitch)
    gl!.uniform1f(loc.uZoom!, zoom)
    gl!.uniform1f(loc.uDpr!, dpr)
    gl!.uniform1i(loc.uFilter!, filter)
    gl!.uniform1f(loc.uDark!, darkMode ? 1 : 0)
    if (linksVisible) {
      gl!.uniform1f(loc.uPoints!, 0)
      gl!.uniform1f(loc.uGlow!, 0)
      gl!.bindVertexArray(activeLinks.vao)
      gl!.drawArrays(gl!.LINES, 0, activeLinks.len)
    }
    gl!.uniform1f(loc.uPoints!, 1)
    gl!.bindVertexArray(pVao.vao)
    gl!.uniform1f(loc.uGlow!, 1)
    gl!.drawArrays(gl!.POINTS, 0, pVao.len)
    gl!.uniform1f(loc.uGlow!, 0)
    gl!.drawArrays(gl!.POINTS, 0, pVao.len)
    gl!.bindVertexArray(null)
  }

  let prev = 0
  function frame(now: number) {
    if (destroyed) return
    if (!paused && !dragging) { yaw += Math.min(32, now - prev) * .00008 }
    prev = now
    draw()
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)

  const stage = canvas.parentElement!

  function onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return
    dragging = true; moved = false; lastX = e.clientX; lastY = e.clientY
    stage.classList.add('dragging')
    stage.setPointerCapture(e.pointerId)
  }
  let hoverRaf = 0
  function onPointerMove(e: PointerEvent) {
    if (dragging) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY
      if (Math.abs(dx) + Math.abs(dy) > 1) moved = true
      yaw += dx * .006
      pitch = Math.max(-1.5, Math.min(1.5, pitch + dy * .005))
      lastX = e.clientX; lastY = e.clientY
    } else if (onHover) {
      const mx = e.clientX, my = e.clientY
      cancelAnimationFrame(hoverRaf)
      hoverRaf = requestAnimationFrame(() => hoverPick(mx, my))
    }
  }
  function onPointerUp(e: PointerEvent) {
    dragging = false
    stage.classList.remove('dragging')
    if (!moved) pick(e.clientX, e.clientY)
  }
  function onWheel(e: WheelEvent) {
    e.preventDefault()
    zoom = Math.max(.35, Math.min(4.8, zoom * Math.exp(-e.deltaY * .0012)))
  }

  function pick(mx: number, my: number) {
    let best = -1, dist = 11 * 11
    const rect = canvas.getBoundingClientRect()
    const cw = rect.width, ch = rect.height
    const aspect = cw / ch
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch)
    for (let i = 0; i < n; i++) {
      const p = nodes[i]
      if (filter !== -1 && p.topic !== filter) continue
      const rx = cy * p.x + sy * p.z, rz = -sy * p.x + cy * p.z
      const ry = cp * p.y - sp * rz, rz2 = sp * p.y + cp * rz
      const per = 34 / (34 - rz2 * .52)
      const sx = (rx * per * zoom / (21.5 * aspect) * .5 + .5) * cw + rect.left
      const syy = (-ry * per * zoom / 21.5 * .5 + .5) * ch + rect.top
      const d = (sx - mx) ** 2 + (syy - my) ** 2
      if (d < dist) { dist = d; best = i }
    }
    onPick?.(best >= 0 ? nodes[best] : null, mx, my)
  }

  function hoverPick(mx: number, my: number) {
    let best = -1, dist = 14 * 14
    const rect = canvas.getBoundingClientRect()
    const cw = rect.width, ch = rect.height
    const aspect = cw / ch
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch)
    for (let i = 0; i < n; i++) {
      const p = nodes[i]
      if (filter !== -1 && p.topic !== filter) continue
      const rx = cy * p.x + sy * p.z, rz = -sy * p.x + cy * p.z
      const ry = cp * p.y - sp * rz, rz2 = sp * p.y + cp * rz
      const per = 34 / (34 - rz2 * .52)
      const sx = (rx * per * zoom / (21.5 * aspect) * .5 + .5) * cw + rect.left
      const syy = (-ry * per * zoom / 21.5 * .5 + .5) * ch + rect.top
      const d = (sx - mx) ** 2 + (syy - my) ** 2
      if (d < dist) { dist = d; best = i }
    }
    onHover?.(best >= 0 ? nodes[best] : null, mx, my)
    canvas.style.cursor = best >= 0 ? 'pointer' : ''
  }

  function onPointerLeave() { onHover?.(null, 0, 0); canvas.style.cursor = '' }

  stage.addEventListener('pointerdown', onPointerDown)
  stage.addEventListener('pointermove', onPointerMove)
  stage.addEventListener('pointerup', onPointerUp)
  stage.addEventListener('pointerleave', onPointerLeave)
  stage.addEventListener('wheel', onWheel, { passive: false })

  function getFilteredStats() {
    const np = filter < 0 ? n : nodes.filter(p => p.topic === filter).length
    const ne = filter < 0 ? edges.length : edges.filter(e => nodes[e.src].topic === filter && nodes[e.dst].topic === filter).length
    return { points: np, links: ne }
  }

  return {
    setFilter(topic: number) {
      filter = topic
      replaceLinks()
    },
    togglePause() { paused = !paused; return paused },
    toggleLinks() { linksVisible = !linksVisible; return linksVisible },
    toggleCurves() { curveMode = !curveMode; replaceLinks(); return curveMode },
    resetView() { yaw = initial.yaw; pitch = initial.pitch; zoom = initial.zoom },
    getStats: getFilteredStats,
    destroy() {
      destroyed = true
      stage.removeEventListener('pointerdown', onPointerDown)
      stage.removeEventListener('pointermove', onPointerMove)
      stage.removeEventListener('pointerup', onPointerUp)
      stage.removeEventListener('pointerleave', onPointerLeave)
      stage.removeEventListener('wheel', onWheel)
    },
  }
}
