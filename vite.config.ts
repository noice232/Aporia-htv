import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const proxy = { '/api': { target: 'http://localhost:8000', changeOrigin: true } }

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-private-scene-dev-only',
      configureServer(server) {
        server.middlewares.use('/demo-scene', (request, response, next) => {
          const name = request.url?.split('?')[0]?.replace(/^\//, '')
          if (
            (name !== 'scene.ply' && name !== 'scene-sample.ply') ||
            !['GET', 'HEAD'].includes(request.method ?? '')
          )
            return next()
          const target = resolve(process.cwd(), '.local-scenes', name)
          if (!existsSync(target)) {
            response.statusCode = 404
            response.end('Local scene unavailable')
            return
          }
          response.setHeader('Content-Type', 'application/octet-stream')
          response.setHeader('Content-Length', statSync(target).size)
          if (request.method === 'HEAD') return response.end()
          createReadStream(target).pipe(response)
        })
      },
    },
  ],
  server: { proxy },
  preview: { proxy },
})
