import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
const OUT = '/home/taha/code/smart-marketplace/frontend/instagram/posts'; mkdirSync(OUT, { recursive: true })
const port = 9444
const chrome = spawn('google-chrome', ['--headless=new','--no-sandbox','--disable-gpu','--hide-scrollbars','--allow-file-access-from-files',`--remote-debugging-port=${port}`,'--user-data-dir=/tmp/shots/ig/profile','about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let targets
for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.find(t=>t.type==='page')) break } catch {} await sleep(250) }
const ws = new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl)
await new Promise(r => ws.onopen = r)
let id = 0; const pending = new Map()
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } }
const send = (method, params={}) => new Promise(res => { const i=++id; pending.set(i,res); ws.send(JSON.stringify({id:i,method,params})) })
await send('Page.enable')
await send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 8100, deviceScaleFactor: 1, mobile: false })
await send('Page.navigate', { url: 'file:///home/taha/code/smart-marketplace/frontend/instagram/slides.html' })
await sleep(6000)
await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(()=>document.fonts.size)', awaitPromise: true })
for (let n = 1; n <= 6; n++) {
  const { result } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: (n-1)*1350, width: 1080, height: 1350, scale: 1 } })
  writeFileSync(`${OUT}/instagram-${n}.png`, Buffer.from(result.data, 'base64'))
  console.log('slide', n)
}
ws.close(); chrome.kill(); process.exit(0)
