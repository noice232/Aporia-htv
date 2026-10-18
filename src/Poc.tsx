import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  CircleHelp,
  Download,
  FlaskConical,
  ImagePlus,
  Layers3,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from 'lucide-react'

type AngleId = 'baseline' | 'left' | 'right'
type SceneState = 'loading' | 'ready' | 'error'
type SceneKind = 'public' | 'private' | 'upload'

type ViewerHandle = {
  camera: {
    position: { set: (x: number, y: number, z: number) => void }
    lookAt: (x: number, y: number, z: number) => void
  }
  controls?: {
    target?: { set: (x: number, y: number, z: number) => void }
    update?: () => void
  }
  renderer?: { domElement: HTMLCanvasElement }
  addSplatScene: (url: string, options: Record<string, unknown>) => Promise<unknown>
  start: () => void
  render: () => void
  dispose: () => Promise<void>
}

const privateAngles: {
  id: AngleId
  name: string
  position: [number, number, number]
  description: string
}[] = [
  {
    id: 'baseline',
    name: 'Source view',
    position: [0, -3.7, -4.4],
    description: 'Embedded camera direction',
  },
  {
    id: 'left',
    name: 'Left candidate',
    position: [-18, -3.7, -4.4],
    description: 'Explore one side of the scene',
  },
  {
    id: 'right',
    name: 'Right candidate',
    position: [18, -3.7, -4.4],
    description: 'Explore the opposite side',
  },
]
const publicAngles: typeof privateAngles = [
  { id: 'baseline', name: 'Front view', position: [0, -1, 3], description: 'Public model starting pose' },
  {
    id: 'left',
    name: 'Left candidate',
    position: [-1.3, -1, 2.7],
    description: 'Explore one side of the object',
  },
  {
    id: 'right',
    name: 'Right candidate',
    position: [1.3, -1, 2.7],
    description: 'Explore the opposite side',
  },
]

function timeNow() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

async function frameOccupancy(dataUrl: string): Promise<number> {
  const image = new Image()
  image.src = dataUrl
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('The browser could not inspect the captured image.')
  context.drawImage(image, 0, 0)
  const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data
  let visible = 0
  for (let index = 3; index < rgba.length; index += 4) if (rgba[index] > 8) visible++
  return (visible / (canvas.width * canvas.height)) * 100
}

function MaskPainter({ source, name }: { source: string; name: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const previousRef = useRef<[number, number] | null>(null)

  useEffect(() => {
    const image = new Image()
    image.onload = () => {
      if (!canvasRef.current) return
      canvasRef.current.width = image.naturalWidth
      canvasRef.current.height = image.naturalHeight
    }
    image.src = source
  }, [source])

  function point(event: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const canvas = event.currentTarget
    const rect = canvas.getBoundingClientRect()
    return [
      ((event.clientX - rect.left) / rect.width) * canvas.width,
      ((event.clientY - rect.top) / rect.height) * canvas.height,
    ]
  }

  function paint(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    const canvas = event.currentTarget
    const context = canvas.getContext('2d')
    if (!context) return
    const next = point(event)
    context.strokeStyle = '#ffffff'
    context.lineWidth = Math.max(14, canvas.width * 0.04)
    context.lineCap = 'round'
    context.lineJoin = 'round'
    context.beginPath()
    context.moveTo(...(previousRef.current ?? next))
    context.lineTo(...next)
    context.stroke()
    previousRef.current = next
  }

  function downloadMask() {
    const painted = canvasRef.current
    if (!painted) return
    const mask = document.createElement('canvas')
    mask.width = painted.width
    mask.height = painted.height
    const context = mask.getContext('2d')
    if (!context) return
    context.fillStyle = '#000000'
    context.fillRect(0, 0, mask.width, mask.height)
    context.drawImage(painted, 0, 0)
    const link = document.createElement('a')
    link.href = mask.toDataURL('image/png')
    link.download = `${name}-inpaint-mask.png`
    link.click()
  }

  return (
    <div className="poc-mask-editor">
      <div className="poc-mask-canvas">
        <img src={source} alt={`${name} render to mark for inpainting`} />
        <canvas
          ref={canvasRef}
          className="poc-mask-layer"
          aria-label="Paint missing region mask"
          onPointerDown={(event) => {
            drawingRef.current = true
            previousRef.current = point(event)
            event.currentTarget.setPointerCapture(event.pointerId)
            paint(event)
          }}
          onPointerMove={paint}
          onPointerUp={() => {
            drawingRef.current = false
            previousRef.current = null
          }}
          onPointerCancel={() => {
            drawingRef.current = false
            previousRef.current = null
          }}
        />
      </div>
      <div className="poc-mask-actions">
        <span>Paint the missing region in white. The downloaded mask has a black background.</span>
        <a href={source} download={`${name}-view.png`}>
          <Download size={14} /> Download view
        </a>
        <button
          type="button"
          onClick={() =>
            canvasRef.current
              ?.getContext('2d')
              ?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          }
        >
          Clear mask
        </button>
        <button type="button" onClick={downloadMask}>
          <Download size={14} /> Download mask
        </button>
      </div>
    </div>
  )
}

export default function Poc() {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<ViewerHandle | null>(null)
  const [sceneUrl, setSceneUrl] = useState('/public-scene/blackjacket.ply')
  const [sceneName, setSceneName] = useState('blackjacket.ply')
  const [sceneKind, setSceneKind] = useState<SceneKind>('public')
  const [privateAvailable, setPrivateAvailable] = useState(false)
  const [sceneState, setSceneState] = useState<SceneState>('loading')
  const [sceneError, setSceneError] = useState('')
  const [angle, setAngle] = useState<AngleId>('baseline')
  const [captures, setCaptures] = useState<Partial<Record<AngleId, string>>>({})
  const [occupancy, setOccupancy] = useState<Partial<Record<AngleId, number>>>({})
  const [maskSource, setMaskSource] = useState<AngleId>('baseline')
  const [captureError, setCaptureError] = useState('')
  const [inpaintUrl, setInpaintUrl] = useState<string | null>(null)
  const [guidance, setGuidance] = useState('')
  const [approvedGuidance, setApprovedGuidance] = useState('')
  const [papiersConnected, setPapiersConnected] = useState(false)
  const [papiersChecked, setPapiersChecked] = useState(false)
  const [events, setEvents] = useState<{ time: string; text: string }[]>([
    { time: timeNow(), text: 'Proof of concept opened' },
  ])
  const angles = sceneKind === 'private' ? privateAngles : publicAngles
  const cameraTarget: [number, number, number] = sceneKind === 'private' ? [0, 0, 30] : [0, -1, 0]

  useEffect(() => {
    void fetch('/demo-scene/scene-sample.ply', { method: 'HEAD' })
      .then((response) =>
        setPrivateAvailable(response.ok && !response.headers.get('content-type')?.includes('text/html')),
      )
      .catch(() => setPrivateAvailable(false))
  }, [])

  function addEvent(text: string) {
    setEvents((previous) => [{ time: timeNow(), text }, ...previous].slice(0, 8))
  }

  useEffect(() => {
    void fetch('/api/v1/papiers/status')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        setPapiersConnected(data?.connected === true)
        setPapiersChecked(true)
      })
      .catch(() => setPapiersChecked(true))
  }, [])

  useEffect(() => {
    document.title = 'APORIA · 3DGS research PoC'
    let cancelled = false
    let currentViewer: ViewerHandle | null = null
    let viewerContainer: HTMLDivElement | null = null
    setSceneState('loading')
    setSceneError('')
    setCaptures({})
    setOccupancy({})
    setMaskSource('baseline')
    setAngle('baseline')

    async function loadScene() {
      try {
        const Splats = await import('@mkkellogg/gaussian-splats-3d')
        if (cancelled || !hostRef.current) return
        viewerContainer = document.createElement('div')
        viewerContainer.style.width = '100%'
        viewerContainer.style.height = '100%'
        hostRef.current.appendChild(viewerContainer)
        const viewer = new Splats.Viewer({
          rootElement: viewerContainer,
          cameraUp: [0, 1, 0],
          initialCameraPosition: angles[0].position,
          initialCameraLookAt: cameraTarget,
          sharedMemoryForWorkers: false,
          gpuAcceleratedSort: false,
          integerBasedSort: false,
          ignoreDevicePixelRatio: true,
          useBuiltInControls: true,
        }) as ViewerHandle
        currentViewer = viewer
        viewerRef.current = viewer
        await viewer.addSplatScene(sceneUrl, {
          format: /\.ksplat$/i.test(sceneName)
            ? Splats.SceneFormat.KSplat
            : /\.splat$/i.test(sceneName)
              ? Splats.SceneFormat.Splat
              : Splats.SceneFormat.Ply,
          showLoadingUI: true,
          splatAlphaRemovalThreshold: 5,
          progressiveLoad: true,
        })
        if (cancelled) return
        viewer.start()
        setSceneState('ready')
        addEvent(`Loaded ${sceneName} in the interactive splat viewer`)
      } catch (error) {
        if (cancelled) return
        if (!currentViewer) viewerContainer?.remove()
        setSceneState('error')
        setSceneError(error instanceof Error ? error.message : 'The scene could not be loaded.')
      }
    }

    void loadScene()
    return () => {
      cancelled = true
      if (viewerRef.current === currentViewer) viewerRef.current = null
      if (currentViewer && viewerContainer) {
        // This viewer version removes its root directly from document.body on disposal.
        // Its own nested container can be moved there without moving React's host node.
        document.body.appendChild(viewerContainer)
        void currentViewer.dispose().catch(() => viewerContainer?.remove())
      }
      if (sceneUrl.startsWith('blob:')) URL.revokeObjectURL(sceneUrl)
    }
  }, [sceneUrl, sceneName, sceneKind])

  function chooseAngle(next: AngleId) {
    const viewer = viewerRef.current
    const preset = angles.find((item) => item.id === next)
    if (!viewer || !preset) return
    viewer.camera.position.set(...preset.position)
    viewer.camera.lookAt(...cameraTarget)
    viewer.controls?.target?.set(...cameraTarget)
    viewer.controls?.update?.()
    setAngle(next)
    setCaptureError('')
    addEvent(`Previewed ${preset.name.toLowerCase()}`)
  }

  async function captureView() {
    const viewer = viewerRef.current
    if (!viewer?.renderer?.domElement) return
    try {
      viewer.render()
      await new Promise((resolve) => window.setTimeout(resolve, 250))
      viewer.render()
      const dataUrl = viewer.renderer.domElement.toDataURL('image/png')
      if (dataUrl.length < 100)
        throw new Error('The browser did not return an image. Try again after the scene settles.')
      const measuredOccupancy = await frameOccupancy(dataUrl)
      setCaptures((previous) => ({ ...previous, [angle]: dataUrl }))
      setOccupancy((previous) => ({ ...previous, [angle]: measuredOccupancy }))
      setMaskSource(angle)
      setCaptureError('')
      addEvent(`Captured ${angles.find((item) => item.id === angle)?.name.toLowerCase()} render`)
    } catch (error) {
      setCaptureError(error instanceof Error ? error.message : 'Capture failed.')
    }
  }

  function loadLocalScene(file: File | undefined) {
    if (!file) return
    if (!/\.(ply|splat|ksplat)$/i.test(file.name)) {
      setSceneError('Choose a .ply, .splat, or .ksplat scene file.')
      return
    }
    setSceneName(file.name)
    setSceneKind('upload')
    setSceneUrl(URL.createObjectURL(file))
  }

  function chooseIncludedScene(kind: 'public' | 'private') {
    setSceneKind(kind)
    setSceneName(kind === 'public' ? 'blackjacket.ply' : 'scene-sample.ply')
    setSceneUrl(kind === 'public' ? '/public-scene/blackjacket.ply' : '/demo-scene/scene-sample.ply')
  }

  function loadInpaint(file: File | undefined) {
    if (!file) return
    setInpaintUrl(URL.createObjectURL(file))
    addEvent(`Attached ${file.name} as a user-supplied completion image`)
  }

  function saveGuidance(event: React.FormEvent) {
    event.preventDefault()
    const text = guidance.trim()
    if (!text) return
    setApprovedGuidance(text)
    setGuidance('')
    addEvent('Human guidance recorded in this browser session')
  }

  return (
    <div className="poc-shell">
      <aside className="poc-rail">
        <a className="poc-brand" href="/">
          <span className="poc-brand-mark">
            <span />
            <span />
            <span />
          </span>
          <span>
            <strong>APORIA</strong>
            <small>research in motion</small>
          </span>
        </a>
        <div className="poc-rail-label">ACTIVE INVESTIGATION</div>
        <div className="poc-mission-mini">
          <span className="poc-mission-icon">
            <Layers3 size={19} />
          </span>
          <strong>Find the best next view</strong>
          <small>3D scene completion · proof of concept</small>
        </div>
        <div className="poc-rail-label">RESEARCH PATH</div>
        <div className="poc-steps">
          <div className="done">
            <span>
              <Check size={14} />
            </span>
            <div>
              <strong>Source scene</strong>
              <small>Gaussian splat PLY</small>
            </div>
          </div>
          <div className="active">
            <span>2</span>
            <div>
              <strong>Explore angles</strong>
              <small>Interactive novel views</small>
            </div>
          </div>
          <div>
            <span>3</span>
            <div>
              <strong>Complete gaps</strong>
              <small>Inpainting output</small>
            </div>
          </div>
          <div>
            <span>4</span>
            <div>
              <strong>Evaluate & choose</strong>
              <small>Measured comparison</small>
            </div>
          </div>
        </div>
        <div className="poc-rail-bottom">
          <span className="poc-live-dot" /> Prototype <span className="poc-rail-separator">·</span> inspect
          provenance
        </div>
      </aside>

      <div className="poc-workspace">
        <header className="poc-topbar">
          <div className="poc-breadcrumb">
            <span>Research Lab</span>
            <ChevronRight size={15} />
            <strong>Scene exploration</strong>
          </div>
          <div className="poc-top-actions">
            <span className="poc-mode">PROTOTYPE</span>
            <a href="/demo">
              <ArrowLeft size={14} /> Research workspace
            </a>
          </div>
        </header>

        <main className="poc-content">
          <div className="poc-heading">
            <div>
              <span className="poc-kicker">
                <Sparkles size={14} /> ACTIVE RESEARCH SESSION
              </span>
              <h1>Where should the camera go next?</h1>
              <p>
                Inspect a real Gaussian splat scene, capture candidate views, then compare completion evidence
                before choosing an angle.
              </p>
            </div>
            <div className="poc-session-tag">
              <span className="poc-live-dot" /> Human-visible session
            </div>
          </div>

          <div className="poc-main-grid">
            <section className="poc-viewer-panel">
              <div className="poc-panel-head">
                <div>
                  <span className="poc-section-label">3D EXPERIMENT VIEWER</span>
                  <h2>{sceneName}</h2>
                </div>
                <span className={`poc-state ${sceneState}`}>
                  {sceneState === 'loading' ? (
                    <LoaderCircle size={14} className="poc-spin" />
                  ) : sceneState === 'ready' ? (
                    <Check size={14} />
                  ) : (
                    <CircleHelp size={14} />
                  )}
                  {sceneState === 'loading'
                    ? 'Loading splats'
                    : sceneState === 'ready'
                      ? 'Scene ready'
                      : 'Scene unavailable'}
                </span>
              </div>
              <div className="poc-scene-stage">
                <div className="poc-splat-host" ref={hostRef} />
                {sceneState === 'loading' && (
                  <div className="poc-stage-message">
                    <LoaderCircle size={25} className="poc-spin" />
                    <strong>
                      {sceneKind === 'public'
                        ? 'Preparing 41,470 public splats'
                        : sceneKind === 'private'
                          ? 'Preparing 147,456 sampled splats'
                          : 'Preparing scene splats'}
                    </strong>
                    <small>The first load may take a moment.</small>
                  </div>
                )}
                {sceneState === 'error' && (
                  <div className="poc-stage-message error">
                    <CircleHelp size={25} />
                    <strong>Scene could not load</strong>
                    <small>{sceneError}</small>
                    <label className="poc-inline-upload">
                      <UploadCloud size={15} /> Choose a scene
                      <input
                        type="file"
                        accept=".ply,.splat,.ksplat"
                        onChange={(event) => loadLocalScene(event.target.files?.[0])}
                      />
                    </label>
                  </div>
                )}
                {sceneState === 'ready' && (
                  <div className="poc-stage-hint">
                    Drag to orbit <span>·</span> Scroll to zoom <span>·</span> Select an angle below
                  </div>
                )}
              </div>
              <div className="poc-viewer-toolbar">
                <div>
                  <span className="poc-section-label">CANDIDATE CAMERA POSES</span>
                  <div className="poc-angle-list">
                    {angles.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={angle === item.id ? 'selected' : ''}
                        onClick={() => chooseAngle(item.id)}
                        disabled={sceneState !== 'ready'}
                      >
                        <Camera size={15} />
                        <span>
                          <strong>{item.name}</strong>
                          <small>{item.description}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  className="poc-capture"
                  type="button"
                  onClick={captureView}
                  disabled={sceneState !== 'ready'}
                >
                  <Camera size={16} /> Capture view
                </button>
              </div>
              {captureError && (
                <p className="poc-error" role="alert">
                  {captureError}
                </p>
              )}
            </section>

            <aside className="poc-inspector">
              <section className="poc-side-card">
                <span className="poc-section-label">SCENE PROVENANCE</span>
                <h3>Real scene asset</h3>
                <p>
                  {sceneKind === 'public'
                    ? 'Public 3DGS model by geofront e.U., licensed CC BY 4.0. The viewer reads the actual Gaussian data.'
                    : sceneKind === 'private'
                      ? 'Private local demo file: a deterministic 1-in-8 subset of the supplied scene. It is excluded from public builds.'
                      : 'User-selected local scene. Its splats are rendered in this browser; no scene data is uploaded by APORIA.'}
                </p>
                <div className="poc-fact">
                  <span>File</span>
                  <strong>{sceneName}</strong>
                </div>
                {sceneKind !== 'upload' && (
                  <>
                    <div className="poc-fact">
                      <span>Splats</span>
                      <strong>{sceneKind === 'public' ? '41,470' : '147,456 sampled'}</strong>
                    </div>
                    {sceneKind === 'private' && (
                      <div className="poc-fact">
                        <span>Embedded source size</span>
                        <strong>960 × 540</strong>
                      </div>
                    )}
                  </>
                )}
                {sceneKind === 'public' && (
                  <a
                    className="poc-scene-credit"
                    href="https://geofront.eu/splatting_guide/models.html"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View source and license
                  </a>
                )}
                <div className="poc-scene-switch">
                  <button
                    type="button"
                    className={sceneKind === 'public' ? 'active' : ''}
                    onClick={() => chooseIncludedScene('public')}
                  >
                    Public scene
                  </button>
                  {privateAvailable && (
                    <button
                      type="button"
                      className={sceneKind === 'private' ? 'active' : ''}
                      onClick={() => chooseIncludedScene('private')}
                    >
                      Private local sample
                    </button>
                  )}
                </div>
                <label className="poc-upload">
                  <UploadCloud size={16} /> Replace local scene
                  <input
                    type="file"
                    accept=".ply,.splat,.ksplat"
                    onChange={(event) => loadLocalScene(event.target.files?.[0])}
                  />
                </label>
              </section>
              <section className="poc-side-card">
                <span className="poc-section-label">EVIDENCE STATUS</span>
                <h3>What has been tested?</h3>
                <div className="poc-status-row">
                  <span className="poc-status-dot ready" /> Interactive scene render <strong>Ready</strong>
                </div>
                <div className="poc-status-row">
                  <span className="poc-status-dot ready" /> 2D frame occupancy{' '}
                  <strong>{Object.keys(occupancy).length ? 'Measured' : 'Ready'}</strong>
                </div>
                <div className="poc-status-row">
                  <span className="poc-status-dot pending" /> Coverage metric <strong>Pending</strong>
                </div>
                <div className="poc-status-row">
                  <span className="poc-status-dot pending" /> Inpainting run <strong>Pending</strong>
                </div>
                <div className="poc-status-row">
                  <span className="poc-status-dot pending" /> Best-angle claim <strong>Pending</strong>
                </div>
                <p className="poc-note">
                  Captured previews are visual observations. No scientific winner is declared until a common
                  evaluator measures every candidate.
                </p>
              </section>
              <section className="poc-side-card">
                <span className="poc-section-label">RESEARCH CONTEXT</span>
                <h3>Papiers</h3>
                <p>
                  {papiersConnected
                    ? 'Connector authenticated. No library note has been used in this scene experiment yet.'
                    : 'Library retrieval is unavailable. Human notes can still be recorded below.'}
                </p>
                <span className={`poc-disconnected ${papiersConnected ? 'connected' : ''}`}>
                  {papiersConnected ? 'Connected' : papiersChecked ? 'Disconnected' : 'Checking'}
                </span>
              </section>
            </aside>
          </div>

          <div className="poc-lower-grid">
            <section className="poc-lower-card">
              <div className="poc-lower-head">
                <div>
                  <span className="poc-section-label">VIEW COMPARISON</span>
                  <h2>Evidence from candidate angles</h2>
                </div>
                <span>{Object.keys(captures).length} / 3 captured</span>
              </div>
              <div className="poc-capture-grid">
                {angles.map((item) => (
                  <div className="poc-capture-card" key={item.id}>
                    <div className="poc-capture-image">
                      {captures[item.id] ? (
                        <img src={captures[item.id]} alt={`${item.name} captured render`} />
                      ) : (
                        <span>
                          <Camera size={24} /> Capture this angle to compare
                        </span>
                      )}
                    </div>
                    <div className="poc-capture-caption">
                      <strong>{item.name}</strong>
                      {captures[item.id] ? (
                        <a
                          href={captures[item.id]}
                          download={`${item.id}-view.png`}
                          aria-label={`Download ${item.name} capture`}
                        >
                          <Download size={16} />
                        </a>
                      ) : (
                        <small>Not captured</small>
                      )}
                    </div>
                    {occupancy[item.id] != null && (
                      <div className="poc-occupancy">
                        <span>Rendered pixels in frame</span>
                        <strong>{occupancy[item.id]?.toFixed(1)}%</strong>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {Object.keys(occupancy).length > 0 && (
                <p className="poc-occupancy-note">
                  Measured from nontransparent pixels in each captured PNG. This is a 2D framing proxy; it
                  does not measure unseen 3D geometry or identify the best camera angle.
                </p>
              )}
              <div className="poc-mask-section">
                <div>
                  <span className="poc-section-label">MISSING REGION MASK</span>
                  <h3>Mark what needs completion</h3>
                  <p>
                    Choose a captured view, paint the gap, then download its render and mask for a real GPU
                    job.
                  </p>
                </div>
                <div className="poc-mask-choices">
                  {angles
                    .filter((item) => captures[item.id])
                    .map((item) => (
                      <button
                        type="button"
                        className={maskSource === item.id ? 'active' : ''}
                        key={item.id}
                        onClick={() => setMaskSource(item.id)}
                      >
                        {item.name}
                      </button>
                    ))}
                </div>
                {captures[maskSource] ? (
                  <MaskPainter key={maskSource} source={captures[maskSource]} name={maskSource} />
                ) : (
                  <p className="poc-mask-empty">Capture a camera view to prepare an inpainting mask.</p>
                )}
              </div>
              <div className="poc-inpaint">
                <div>
                  <span className="poc-section-label">SCENE COMPLETION</span>
                  <h3>Attach a GPU inpainting result</h3>
                  <p>
                    Upload an actual output from the H200 run. The PoC keeps it separate from observed scene
                    pixels.
                  </p>
                </div>
                <label className="poc-upload">
                  <ImagePlus size={16} /> Add result image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => loadInpaint(event.target.files?.[0])}
                  />
                </label>
                {inpaintUrl && <img src={inpaintUrl} alt="User supplied inpainting result" />}
              </div>
            </section>
            <div className="poc-right-stack">
              <section className="poc-lower-card">
                <span className="poc-section-label">HUMAN CHECKPOINT</span>
                <h2>Your scientific judgment</h2>
                <p>
                  Record what should matter in the next comparison. This local note does not silently change a
                  measured result.
                </p>
                <form onSubmit={saveGuidance}>
                  <textarea
                    value={guidance}
                    onChange={(event) => setGuidance(event.target.value)}
                    placeholder="For example: prioritize unobserved geometry over the most attractive single image."
                    rows={3}
                  />
                  <button type="submit" disabled={!guidance.trim()}>
                    <ShieldCheck size={16} /> Record guidance
                  </button>
                </form>
                {approvedGuidance && (
                  <div className="poc-guidance">
                    <Check size={15} />
                    <span>{approvedGuidance}</span>
                  </div>
                )}
              </section>
              <section className="poc-lower-card">
                <span className="poc-section-label">SESSION TIMELINE</span>
                <h2>Inspectable steps</h2>
                <div className="poc-events">
                  {events.map((item, index) => (
                    <div key={`${item.time}-${index}`}>
                      <span className="poc-event-dot" />
                      <p>
                        {item.text}
                        <small>{item.time}</small>
                      </p>
                    </div>
                  ))}
                </div>
                <span className="poc-local-note">
                  <RotateCcw size={13} /> Browser-local PoC history
                </span>
              </section>
            </div>
          </div>
          <footer className="poc-footer">
            <FlaskConical size={15} /> Proof of concept · real splat asset · experiment outcomes pending GPU
            evaluation
          </footer>
        </main>
      </div>
    </div>
  )
}
