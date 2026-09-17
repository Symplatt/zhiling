const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const fs = require('node:fs/promises')
const path = require('node:path')
let win, allowClose = false, saving = Promise.resolve()
const limit = 64 * 1024 * 1024
const dataPath = () => path.join(app.getPath('userData'), 'atlas.json')
function serialize(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.characters) || !Array.isArray(data.relations)) throw new Error('无效的关系网数据。')
  const text = JSON.stringify(data, null, 2)
  if (Buffer.byteLength(text) > limit) throw new Error('关系网超过 64 MB，请减少头像大小。')
  return text
}
async function readJson(file) {
  const stat = await fs.stat(file)
  if (stat.size > limit) throw new Error('JSON 文件超过 64 MB。')
  return JSON.parse((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, ''))
}
async function imageData(file) {
  const ext = path.extname(file).toLowerCase(), mime = { '.png': 'png', '.jpg': 'jpeg', '.jpeg': 'jpeg', '.webp': 'webp', '.gif': 'gif' }[ext]
  if (!mime) throw new Error('请选择 PNG、JPG、WebP 或 GIF 图片。')
  if ((await fs.stat(file)).size > 5 * 1024 * 1024) throw new Error('头像不能超过 5 MB。')
  return `data:image/${mime};base64,${(await fs.readFile(file)).toString('base64')}`
}
function register() {
  ipcMain.handle('atlas:load', async () => {
    try { return { data: await readJson(dataPath()) } }
    catch (e) {
      if (e.code === 'ENOENT') return { data: null }
      try { return { data: await readJson(dataPath() + '.bak'), error: '上次保存文件无法读取，已从备份恢复。' } }
      catch { return { data: null, error: '本地文件无法读取，已保留原文件。请导入备份或创建新关系网。' } }
    }
  })
  ipcMain.handle('atlas:save', (_, data) => {
    const text = serialize(data)
    const operation = saving.catch(() => {}).then(async () => {
      const file = dataPath()
      await fs.mkdir(path.dirname(file), { recursive: true })
      await fs.writeFile(file + '.tmp', text, 'utf8')
      try { await readJson(file); await fs.copyFile(file, file + '.bak') } catch (e) { if (e.code !== 'ENOENT' && !(e instanceof SyntaxError)) throw e }
      await fs.rename(file + '.tmp', file)
    })
    saving = operation
    return operation
  })
  ipcMain.handle('atlas:import', async () => {
    const result = await dialog.showOpenDialog(win, { title: '导入角色关系网', filters: [{ name: 'JSON 关系网', extensions: ['json'] }], properties: ['openFile'] })
    if (result.canceled) return null
    const file = result.filePaths[0], data = await readJson(file), warnings = []
    const base = await fs.realpath(path.dirname(file))
    if (Array.isArray(data.characters)) for (const character of data.characters) {
      if (!character || typeof character.avatar !== 'string' || !character.avatar || character.avatar.startsWith('data:')) continue
      try {
        if (path.isAbsolute(character.avatar) || /^[a-z]+:/i.test(character.avatar)) throw new Error('头像必须使用 JSON 同目录内的相对路径。')
        const candidate = await fs.realpath(path.resolve(base, character.avatar))
        const relative = path.relative(base, candidate)
        if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('头像路径超出 JSON 所在目录。')
        character.avatar = await imageData(candidate)
      } catch { warnings.push(`「${character.name || character.id}」的头像未找到或格式不支持，可在详情中重新选择。`); character.avatar = '' }
    }
    return { data, warnings }
  })
  ipcMain.handle('atlas:export', async (_, data) => {
    const text = serialize(data)
    const result = await dialog.showSaveDialog(win, { title: '导出角色关系网', defaultPath: `${String(data.title || '角色关系网').replace(/[<>:"/\\|?*]/g, '_')}.json`, filters: [{ name: 'JSON 关系网', extensions: ['json'] }] })
    if (result.canceled || !result.filePath) return false
    await fs.writeFile(result.filePath, text, 'utf8')
    return true
  })
  ipcMain.handle('atlas:avatar', async () => {
    const result = await dialog.showOpenDialog(win, { title: '选择角色头像', filters: [{ name: '图片', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }], properties: ['openFile'] })
    return result.canceled ? null : imageData(result.filePaths[0])
  })
  ipcMain.handle('atlas:close', async () => { await saving; allowClose = true; win.close() })
}
app.whenReady().then(() => {
  register()
  Menu.setApplicationMenu(null)
  win = new BrowserWindow({ width: 1440, height: 940, minWidth: 1000, minHeight: 680, backgroundColor: '#f7f8f5', title: '知交 · 角色关系网', icon: path.join(__dirname, '../build/icon.ico'), webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } })
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', e => e.preventDefault())
  win.on('close', e => { if (!allowClose && !win.webContents.isDestroyed()) { e.preventDefault(); win.webContents.send('atlas:closing') } })
  win.loadFile(path.join(__dirname, '../dist/index.html'))
})
app.on('window-all-closed', () => app.quit())
