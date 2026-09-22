import { expect, it } from 'vitest'
import { createRequire } from 'node:module'
import { mkdtemp, mkdir, readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const { ExportPreferences, cleanName } = createRequire(import.meta.url)('../electron/exports.cjs')

it('persists independent destinations and avoids collisions without asking', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zhiling-export-test-'))
  const png = join(root, 'images'), json = join(root, 'backups'), config = join(root, 'prefs.json')
  await Promise.all([mkdir(png), mkdir(json)])
  const prefs = new ExportPreferences(config, root)
  await Promise.all([prefs.save('png', { directory: png, ask: false }), prefs.save('json', { directory: json, ask: false })])
  const restored = new ExportPreferences(config, root)
  expect(await restored.load()).toEqual({ png: { directory: png, ask: false }, json: { directory: json, ask: false } })
  const unexpected = () => { throw new Error('Unexpected save dialog') }
  await Promise.all([restored.export('png', '图', 'first', unexpected), restored.export('png', '图', 'second', unexpected)])
  await restored.export('json', '书架', '{}', unexpected)
  expect((await readdir(png)).sort()).toEqual(['图 (2).png', '图.png'])
  expect(await readFile(join(json, '书架.json'), 'utf8')).toBe('{}')
})
it('honors cancellation, uses the configured initial directory and rejects unavailable folders', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zhiling-export-dialog-'))
  const prefs = new ExportPreferences(join(root, 'settings.json'), root)
  let dialogOptions: { defaultPath: string } | undefined
  expect(await prefs.export('png', '图片', 'content', async (options: { defaultPath: string }) => {
    dialogOptions = options; return { canceled: true }
  })).toBe(false)
  expect(dialogOptions?.defaultPath).toBe(join(root, '图片.png'))
  expect(await readdir(root)).toEqual([])
  await expect(prefs.save('json', { directory: join(root, 'missing'), ask: false })).rejects.toThrow()
  expect((await prefs.load()).json.ask).toBe(true)
  expect(cleanName('../CON:*')).not.toMatch(/[/:*]/)
  expect(cleanName('CON')).toBe('_CON')
})
