// Renders the event-horizon theme's black hole by ray-marching Schwarzschild
// geodesics (u'' = -u + 3u²) past a thin accretion disc.
// Output: src/assets/gargantua-{back,front}.webp
//   front = near-side image of the disc, crossing in front of the shadow
//   back  = everything else (far-side arch, higher-order images)
// Run: npm i --no-save sharp && node scripts/render-gargantua.mjs
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
import { availableParallelism } from 'node:os'
import { fileURLToPath } from 'node:url'

const W = 2400
const H = 1000
const SCALE = 34.6 // pixels per M; shadow radius = 5.196 M
const ELEVATION = (11 * Math.PI) / 180
const R_IN = 3.3
const R_OUT = 28
const DOPPLER = 0.4
const MAX_CROSSINGS = 4

const hash = (x, y) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

// Value noise, periodic in x so fibres close up around the disc
const noise = (x, y, period) => {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const fx = x - xi
  const fy = y - yi
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const p = (i) => ((i % period) + period) % period
  const a = hash(p(xi), yi)
  const b = hash(p(xi + 1), yi)
  const c = hash(p(xi), yi + 1)
  const d = hash(p(xi + 1), yi + 1)
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}

const fibres = (r, psi) => {
  const t = (psi / (2 * Math.PI) + 1) % 1
  const twist = 0.12 * Math.log(r)
  const a = noise((t + twist) * 6 * 3, r * 4, 18) // broad bands
  const b = noise((t + twist) * 11 * 3, r * 14, 33)
  const c = noise((t + twist) * 7 * 5, r * 30, 35)
  const d = noise((t + twist) * 5 * 7, r * 52, 35)
  const v = 0.3 + 0.55 * a + 0.5 * b + 0.3 * c + 0.18 * d
  return Math.min(1.8, Math.max(0.15, v * v * 0.8))
}

const emission = (r, x, cosE) => {
  const inner = Math.min(1, (r - R_IN) / 0.5)
  const outer = 1 - Math.min(1, Math.max(0, (r - 9) / (R_OUT - 9)))
  const radial = (R_IN / r) ** 2.1 * inner * outer
  const g = Math.sqrt(Math.max(0.01, 1 - 3 / r)) / (1 + DOPPLER * r ** -1.5 * x * cosE)
  return 5 * radial * g ** 3
}

const RAMP = [
  [0, 0, 0, 0],
  [0.1, 70, 26, 10],
  [0.28, 150, 66, 30],
  [0.48, 218, 126, 78],
  [0.66, 242, 172, 142],
  [0.84, 255, 228, 204],
  [1, 255, 248, 238],
]

const toColor = (lum, out, o) => {
  const t = 1 - Math.exp(-lum * 2.6)
  let i = 1
  while (i < RAMP.length - 1 && t > RAMP[i][0]) i++
  const [t0, r0, g0, b0] = RAMP[i - 1]
  const [t1, r1, g1, b1] = RAMP[i]
  const k = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))
  out[o] = r0 + (r1 - r0) * k
  out[o + 1] = g0 + (g1 - g0) * k
  out[o + 2] = b0 + (b1 - b0) * k
  out[o + 3] = Math.min(1, t * 3.2) * 255
}

const rhs = (u) => -u + 3 * u * u

// Advances (u, w) over [phi, target] with RK4; returns false if the ray fell in or escaped
const advance = (s, target) => {
  while (s.phi < target - 1e-9) {
    const h = Math.min(0.02 / (1 + 12 * s.u), target - s.phi)
    const k1u = s.w
    const k1w = rhs(s.u)
    const k2u = s.w + 0.5 * h * k1w
    const k2w = rhs(s.u + 0.5 * h * k1u)
    const k3u = s.w + 0.5 * h * k2w
    const k3w = rhs(s.u + 0.5 * h * k2u)
    const k4u = s.w + h * k3w
    const k4w = rhs(s.u + h * k3u)
    s.u += (h / 6) * (k1u + 2 * k2u + 2 * k3u + k4u)
    s.w += (h / 6) * (k1w + 2 * k2w + 2 * k3w + k4w)
    s.phi += h
    if (s.u >= 0.5 || s.u <= 0) return false
  }
  return true
}

const trace = (px, py, front, back, o) => {
  const x = (px + 0.5 - W / 2) / SCALE
  const y = (H / 2 - (py + 0.5)) / SCALE
  const b = Math.hypot(x, y)
  const sinE = Math.sin(ELEVATION)
  const cosE = Math.cos(ELEVATION)
  const esx = x / b
  const esy = y / b
  let phi0 = Math.atan2(-sinE, esy * cosE)
  if (phi0 < 0) phi0 += Math.PI

  const state = { u: 0, w: 1 / b, phi: 0 }
  let frontLum = 0
  let backLum = 0
  let weight = 1
  for (let k = 0; k < MAX_CROSSINGS; k++) {
    if (!advance(state, phi0 + k * Math.PI)) break
    const r = 1 / state.u
    if (r < R_IN || r > R_OUT) continue
    const phi = state.phi
    const z = r * (Math.cos(phi) * cosE - Math.sin(phi) * esy * sinE)
    const px3 = r * Math.sin(phi) * esx
    const lum = emission(r, x, cosE) * fibres(r, Math.atan2(z, px3)) * weight
    if (k === 0 && z > 0) frontLum += lum
    else backLum += lum
    weight *= 0.85
  }
  if (frontLum > 0) toColor(frontLum, front, o)
  if (backLum > 0) toColor(backLum, back, o)
}

const renderRows = (y0, y1) => {
  const front = new Float32Array((y1 - y0) * W * 4)
  const back = new Float32Array((y1 - y0) * W * 4)
  for (let py = y0; py < y1; py++) {
    for (let px = 0; px < W; px++) trace(px, py, front, back, ((py - y0) * W + px) * 4)
  }
  return { front, back }
}

if (!isMainThread) {
  parentPort.postMessage(renderRows(workerData.y0, workerData.y1))
} else {
  const { default: sharp } = await import('sharp')
  const workers = availableParallelism()
  const rows = Math.ceil(H / (workers * 4))
  const bands = Array.from({ length: Math.ceil(H / rows) }, (_, i) => [i * rows, Math.min(H, (i + 1) * rows)])
  const front = new Uint8ClampedArray(W * H * 4)
  const back = new Uint8ClampedArray(W * H * 4)
  const run = ([y0, y1]) =>
    new Promise((resolve, reject) => {
      const worker = new Worker(fileURLToPath(import.meta.url), { workerData: { y0, y1 } })
      worker.on('message', (m) => {
        front.set(m.front, y0 * W * 4)
        back.set(m.back, y0 * W * 4)
        resolve()
      })
      worker.on('error', reject)
    })
  const queue = [...bands]
  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (queue.length) await run(queue.shift())
    }),
  )
  const outDir = new URL('../src/assets/', import.meta.url)
  const save = (pixels, name) =>
    sharp(Buffer.from(pixels.buffer), { raw: { width: W, height: H, channels: 4 } })
      .webp({ quality: 84, alphaQuality: 92 })
      .toFile(fileURLToPath(new URL(name, outDir)))
  await save(back, 'gargantua-back.webp')
  await save(front, 'gargantua-front.webp')
}
