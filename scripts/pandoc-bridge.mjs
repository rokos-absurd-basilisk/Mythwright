#!/usr/bin/env node
// ============================================================
// MYTHWRIGHT — PANDOC BRIDGE (self-hosted)
// Tiny HTTP server on :4567. Receives Markdown + format,
// converts via local Pandoc, returns file bytes.
// Run: npm run pandoc-bridge
// Requires: pandoc CLI installed (https://pandoc.org/installing.html)
// ============================================================
import { createServer } from 'http'
import { exec }         from 'child_process'
import { writeFileSync, readFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join }  from 'path'

const PORT = 4567

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
  if (req.method !== 'POST' || req.url !== '/convert') {
    res.writeHead(404); res.end('Not found'); return
  }
  let body = ''
  for await (const chunk of req) body += chunk
  const { markdown, format, title } = JSON.parse(body)
  const ts = Date.now()
  const inFile  = join(tmpdir(), `mw-${ts}.md`)
  const outFile = join(tmpdir(), `mw-${ts}.${format}`)
  try {
    writeFileSync(inFile, markdown, 'utf-8')
    await new Promise((resolve, reject) =>
      exec(`pandoc "${inFile}" -f markdown -t ${format} -o "${outFile}" --standalone`,
        err => err ? reject(err) : resolve(null))
    )
    const data = readFileSync(outFile)
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${title}.${format}"`,
    })
    res.end(data)
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: String(err) }))
  } finally {
    for (const f of [inFile, outFile]) try { unlinkSync(f) } catch {}
  }
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`✓  Pandoc bridge →  http://localhost:${PORT}`)
  console.log(`   POST /convert  { markdown: string, format: string, title: string }`)
})
