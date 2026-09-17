const fs = require('node:fs/promises')
const path = require('node:path')
class LibraryStore {
  constructor(directory) { this.directory=directory;this.file=path.join(directory,'library.json');this.queue=Promise.resolve() }
  async load() {
    try { const raw=JSON.parse(await fs.readFile(this.file,'utf8'));this.validate(raw);return {data:raw,revision:raw.revision||0} }
    catch(e){
      if(e.code==='ENOENT')return {data:null,revision:0}
      try {const raw=JSON.parse(await fs.readFile(this.file+'.bak','utf8'));this.validate(raw);return {data:raw,revision:raw.revision||0,error:'书架主文件无法读取，已恢复上一份备份。'}}
      catch {throw new Error('书架及备份无法读取，原文件已保留，请恢复 JSON 备份。')}
    }
  }
  validate(data){
    if(!data || data.version!==2 || !Array.isArray(data.graphs) || data.graphs.length<1 || data.graphs.length>1000)throw new Error('书架须包含 1–1,000 张关系网。')
    const ids=new Set()
    for(const entry of data.graphs){
      if(!entry || typeof entry.id!=='string'||ids.has(entry.id)||!entry.data||!Array.isArray(entry.data.characters)||!Array.isArray(entry.data.relations))throw new Error('关系网结构或 ID 不正确。')
      ids.add(entry.id)
    }
    if(!ids.has(data.activeId))throw new Error('当前关系网不存在。')
  }
  save(data,revision){
    const operation=this.queue.catch(()=>{}).then(async()=>{
      this.validate(data)
      const current=await this.load()
      if(revision!==undefined && revision!==current.revision){const e=new Error('另一个窗口已修改书架。请先导出当前关系网备份，再刷新页面。');e.status=409;throw e}
      const next={...data,revision:current.revision+1},text=JSON.stringify(next,null,2)
      if(Buffer.byteLength(text)>128*1024*1024)throw new Error('书架超过 128 MB，请导出部分故事后再试。')
      await fs.mkdir(this.directory,{recursive:true})
      await fs.writeFile(this.file+'.tmp',text,'utf8')
      try {const old=JSON.parse(await fs.readFile(this.file,'utf8'));this.validate(old);await fs.copyFile(this.file,this.file+'.bak')}catch(e){if(e.code!=='ENOENT'&&!(e instanceof SyntaxError)&&!e.message.includes('书架')&&!e.message.includes('关系网'))throw e}
      await fs.rename(this.file+'.tmp',this.file)
      return {revision:next.revision}
    });this.queue=operation;return operation
  }
}
module.exports={LibraryStore}
