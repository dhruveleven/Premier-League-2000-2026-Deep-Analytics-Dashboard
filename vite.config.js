import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-csv-data',
      configureServer(server) {
        server.middlewares.use('/data', (req, res, next) => {
          const candidates = [
            path.resolve(__dirname, '../data'),
            path.resolve(__dirname, 'data'),
          ]
          const dataDir = candidates.find(d => fs.existsSync(d))
          if (!dataDir) { next(); return }
          const safeName = path.basename(req.url)
          const file = path.join(dataDir, safeName)
          if (fs.existsSync(file) && file.endsWith('.csv')) {
            res.setHeader('Content-Type', 'text/csv; charset=utf-8')
            res.setHeader('Cache-Control', 'public, max-age=3600')
            fs.createReadStream(file).pipe(res)
          } else {
            res.statusCode = 404
            res.end('Not found')
          }
        })
      },
    },
  ],
  server: { port: 5173, open: true },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
})
