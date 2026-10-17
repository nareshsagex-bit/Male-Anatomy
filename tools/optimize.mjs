// Compresses the raw Blender exports for the web:
// welds vertices, quantizes attributes and applies Meshopt compression.
// Usage: node tools/optimize.mjs
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const RAW = 'assets-src/models-raw'
const OUT = 'public/models'
const cli = path.join('node_modules', '.bin', process.platform === 'win32' ? 'gltf-transform.cmd' : 'gltf-transform')

for (const file of fs.readdirSync(RAW).filter((f) => f.endsWith('.glb'))) {
  const src = path.join(RAW, file)
  const dst = path.join(OUT, file)
  execFileSync(
    cli,
    ['optimize', src, dst, '--compress', 'meshopt', '--texture-compress', 'false', '--simplify', 'false', '--instance', 'false', '--join', 'false', '--flatten', 'false', '--palette', 'false'],
    { stdio: 'inherit', shell: process.platform === 'win32' },
  )
  const mb = (p) => (fs.statSync(p).size / 1e6).toFixed(1)
  console.log(`${file}: ${mb(src)} MB -> ${mb(dst)} MB`)
}
