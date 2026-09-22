const {app,BrowserWindow,ipcMain,dialog,Menu}=require('electron')
const fs=require('node:fs/promises'),path=require('node:path')
const {LibraryStore}=require('../server/store.cjs')
const {ExportPreferences}=require('./exports.cjs')
let win,store,exportPreferences,allowClose=false
const cleanName=name=>String(name||'织灵关系网').replace(/[<>:"/\\|?*]/g,'_')
app.whenReady().then(()=>{
  store=new LibraryStore(path.join(app.getPath('userData'),'workspace'))
  exportPreferences=new ExportPreferences(path.join(app.getPath('userData'),'export-settings.json'),app.getPath('downloads'))
  ipcMain.handle('atlas:export-settings',()=>exportPreferences.load())
  ipcMain.handle('atlas:export-setting',(_,kind,value)=>exportPreferences.save(kind,value))
  ipcMain.handle('atlas:export-directory',async(_,kind)=>{
    if(!['png','json'].includes(kind))throw new Error('无效的导出类型。')
    const settings=await exportPreferences.load()
    const result=await dialog.showOpenDialog(win,{title:'选择默认导出文件夹',defaultPath:settings[kind].directory,properties:['openDirectory','createDirectory']})
    return result.canceled?null:result.filePaths[0]
  })
  ipcMain.handle('atlas:fullscreen',(_,value)=>{win.setFullScreen(value===true);return win.isFullScreen()})
  ipcMain.handle('atlas:load',async()=>{
    const loaded=await store.load();if(loaded.data)return loaded
    const candidates=[app.getPath('userData'),path.join(app.getPath('appData'),'角色关系网'),path.join(app.getPath('appData'),'novel-atlas')]
    for(const dir of candidates){try{return {data:JSON.parse(await fs.readFile(path.join(dir,'atlas.json'),'utf8'))}}catch(e){if(e.code!=='ENOENT')throw new Error('旧关系网无法读取，原文件未覆盖。')}}
    return {data:null}
  })
  ipcMain.handle('atlas:save',(_,data)=>store.save(data))
  ipcMain.handle('atlas:import',async()=>{
    const result=await dialog.showOpenDialog(win,{title:'导入关系网或书架',filters:[{name:'JSON 数据',extensions:['json']}],properties:['openFile']})
    if(result.canceled)return null
    const file=result.filePaths[0];if((await fs.stat(file)).size>128*1024*1024)throw new Error('文件不能超过 128 MB。')
    return {data:JSON.parse((await fs.readFile(file,'utf8')).replace(/^\uFEFF/,'')),warnings:[]}
  })
  ipcMain.handle('atlas:export',(_,data)=>exportPreferences.export('json',data.version===2?'织灵-完整书架':data.title,JSON.stringify(data,null,2),options=>dialog.showSaveDialog(win,options)))
  ipcMain.handle('atlas:image',(_,buffer,title)=>{
    const bytes=Buffer.from(buffer);if(bytes.length>128*1024*1024||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error('无效的 PNG 图片。')
    return exportPreferences.export('png',cleanName(title)+'-完整关系网',bytes,options=>dialog.showSaveDialog(win,options))
  })
  ipcMain.handle('atlas:close',async()=>{await store.queue;allowClose=true;win.close()})
  Menu.setApplicationMenu(null)
  win=new BrowserWindow({width:1440,height:940,minWidth:960,minHeight:640,backgroundColor:'#f7f8f5',title:'织灵 · 角色关系网',icon:path.join(__dirname,'../build/icon.ico'),webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}})
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault())
  win.on('close',e=>{if(!allowClose&&!win.webContents.isDestroyed()){e.preventDefault();win.webContents.send('atlas:closing')}})
  win.on('enter-full-screen',()=>win.webContents.send('atlas:fullscreen-changed',true))
  win.on('leave-full-screen',()=>win.webContents.send('atlas:fullscreen-changed',false))
  win.loadFile(path.join(__dirname,'../dist/index.html'))
})
app.on('window-all-closed',()=>app.quit())
