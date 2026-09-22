const fs = require('node:fs/promises')
const path = require('node:path')

const cleanName = name => (String(name || '织灵关系网').replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/[. ]+$/, '').slice(0, 100) || '织灵关系网').replace(/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?=\.|$)/i, '_$1')

class ExportPreferences {
  constructor(file, downloads) {
    this.file = file
    this.downloads = downloads
    this.queue = Promise.resolve()
  }
  async load() {
    let saved = {}
    try { saved = JSON.parse(await fs.readFile(this.file, 'utf8')) }
    catch (error) { if (error.code !== 'ENOENT') throw new Error('导出设置无法读取，请检查本机配置文件。') }
    return Object.fromEntries(['png', 'json'].map(kind => [kind, {
      directory: typeof saved[kind]?.directory === 'string' && path.isAbsolute(saved[kind].directory) ? saved[kind].directory : this.downloads,
      ask: saved[kind]?.ask !== false,
    }]))
  }
  save(kind, value) {
    const operation = this.queue.then(async () => {
      if (!['png', 'json'].includes(kind) || typeof value?.directory !== 'string' || !path.isAbsolute(value.directory) || typeof value.ask !== 'boolean') throw new Error('导出设置格式无效。')
      if (!(await fs.stat(value.directory)).isDirectory()) throw new Error('请选择有效的文件夹。')
      const settings = await this.load()
      settings[kind] = { directory: path.resolve(value.directory), ask: value.ask }
      await fs.mkdir(path.dirname(this.file), { recursive: true })
      await fs.writeFile(this.file + '.tmp', JSON.stringify(settings, null, 2), 'utf8')
      await fs.rename(this.file + '.tmp', this.file)
      return settings
    })
    this.queue = operation.catch(() => {})
    return operation
  }
  async export(kind, title, bytes, chooseFile) {
    await this.queue
    const setting = (await this.load())[kind]
    const name = cleanName(title)
    if (setting.ask) {
      const result = await chooseFile({ title: kind === 'png' ? '导出整张关系网' : '导出 JSON',
        defaultPath: path.join(setting.directory, `${name}.${kind}`),
        filters: [{ name: kind === 'png' ? 'PNG 图片' : 'JSON 数据', extensions: [kind] }] })
      if (result.canceled || !result.filePath) return false
      await fs.writeFile(result.filePath, bytes)
      return true
    }
    // Exclusive creation prevents a background export from overwriting an older backup.
    for (let index = 0; index < 10000; index++) {
      const file = path.join(setting.directory, `${name}${index ? ` (${index + 1})` : ''}.${kind}`)
      try { await fs.writeFile(file, bytes, { flag: 'wx' }); return true }
      catch (error) {
        if (error.code !== 'EEXIST') throw new Error(`无法写入导出文件夹，请在图谱设置中重新选择位置。${error.message}`)
      }
    }
    throw new Error('同名导出文件过多，请更换导出文件夹。')
  }
}
module.exports = { ExportPreferences, cleanName }
