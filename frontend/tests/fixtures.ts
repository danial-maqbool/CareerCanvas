import { test as base, expect, request as makeRequest } from '@playwright/test'
import { spawn, ChildProcess } from 'node:child_process'
import { mkdtempSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { createServer } from 'node:net'
type Server = {
  url: string
  empty: any
  demo: any
  restart: () => Promise<void>
}
export const test = base.extend<{ resetWorkspace: void; consoleGuard: void }, { server: Server }>({
  server: [
    async ({}, use) => {
      const root = resolve(process.cwd(), '..'),
        directory = mkdtempSync(join(tmpdir(), 'careercanvas-e2e-'))
      const port = await new Promise<number>((resolve) => {
        const s = createServer()
        s.listen(0, '127.0.0.1', () => {
          const p = (s.address() as any).port
          s.close(() => resolve(p))
        })
      })
      const python =
        process.env.CAREERCANVAS_PYTHON ||
        join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python')
      if (!existsSync(python))
        throw new Error('Create the project Python virtual environment before E2E tests')
      let processHandle: ChildProcess,
        logs = ''
      const url = `http://127.0.0.1:${port}`
      const client = await makeRequest.newContext({ baseURL: url })
      async function start() {
        processHandle = spawn(python, ['run.py'], {
          cwd: root,
          env: {
            ...process.env,
            HOST: '127.0.0.1',
            PORT: String(port),
            DATABASE_URL: 'sqlite:///' + join(directory, 'test.db').replaceAll('\\', '/'),
            AI_ENABLED: 'false',
          },
          windowsHide: true,
        })
        processHandle.stdout?.on('data', (d) => {
          logs += d.toString()
        })
        processHandle.stderr?.on('data', (d) => {
          logs += d.toString()
        })
        for (let i = 0; i < 100; i++) {
          try {
            if ((await client.get('/api/health', { timeout: 1000 })).ok()) return
          } catch {}
          await new Promise((r) => setTimeout(r, 100))
        }
        throw new Error('Isolated server failed: ' + logs.slice(-4000))
      }
      async function stop() {
        if (processHandle.exitCode !== null) return
        await new Promise<void>((resolve) => {
          processHandle.once('exit', () => resolve())
          processHandle.kill()
        })
        let reachable = false
        try {
          reachable = (await client.get('/api/health', { timeout: 1000 })).ok()
        } catch {}
        if (reachable) throw new Error('The old application server is still running after stop')
      }
      await start()
      const empty = await (await client.get('/api/workspace/backup')).json()
      const seeded = await client.post('/api/demo/workspace')
      if (!seeded.ok()) throw new Error(await seeded.text())
      const demo = await (await client.get('/api/workspace/backup')).json()
      try {
        await use({
          url,
          empty,
          demo,
          restart: async () => {
            await stop()
            await start()
          },
        })
      } finally {
        await stop()
        await client.dispose()
      }
    },
    { scope: 'worker' },
  ],
  baseURL: async ({ server }, use) => use(server.url),
  resetWorkspace: [
    async ({ server, request }, use, testInfo) => {
      const backup =
        testInfo.title.includes('first run') || testInfo.title.includes('complete career journey')
          ? server.empty
          : server.demo
      const response = await request.post('/api/workspace/restore', {
        data: { backup, approved: true },
      })
      expect(response.ok(), await response.text()).toBeTruthy()
      await use()
    },
    { auto: true },
  ],
  consoleGuard: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text())
      })
      await use()
      expect(errors, 'No frontend console errors').toEqual([])
    },
    { auto: true },
  ],
})
export { expect }
