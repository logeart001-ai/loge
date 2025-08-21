import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import toIco from 'to-ico'
import sharp from 'sharp'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const srcPng = path.join(projectRoot, 'public', 'image', 'logelogo.png')
const outApp = path.join(projectRoot, 'app', 'favicon.ico')
const outPublic = path.join(projectRoot, 'public', 'favicon.ico')

async function exists(p) {
  try { await fs.promises.access(p); return true } catch { return false }
}

async function generate() {
  if (!(await exists(srcPng))) {
    console.error(`Source logo not found at: ${srcPng}`)
    process.exit(1)
  }

  const sizes = [16, 32, 48, 64]
  const pngBuffers = []

  for (const size of sizes) {
    const buf = await sharp(srcPng)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer()
    pngBuffers.push(buf)
  }

  const icoBuffer = await toIco(pngBuffers)
  await fs.promises.writeFile(outApp, icoBuffer)
  await fs.promises.writeFile(outPublic, icoBuffer)
  console.log(`Generated favicon.ico at:\n - ${outApp}\n - ${outPublic}`)
}

generate().catch(err => {
  console.error('Failed to generate favicon.ico:', err)
  process.exit(1)
})
