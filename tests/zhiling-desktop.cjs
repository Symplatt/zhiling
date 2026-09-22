const {app,dialog}=require('electron'),path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict')
const root=path.resolve(__dirname,process.env.ZHILING_TEST_DIR||'../test-results/revision3-desktop'),profile=path.join(root,'profile')
fs.mkdirSync(path.join(profile,'workspace'),{recursive:true})
const pngPath=path.join(root,'whole-graph.png');if(fs.existsSync(pngPath))fs.unlinkSync(pngPath)
const library={version:2,revision:1,activeId:'s',theme:'grass',graphs:[{id:'s',updatedAt:new Date().toISOString(),data:{version:1,title:'合成图谱测试',description:'',characters:[{id:'a',name:'青禾'},{id:'b',name:'月白'}],relations:[{id:'r',from:'a',to:'b',label:'母亲',reverseLabel:'女儿',mode:'paired',direction:'two-way'}]}}]}
const {nativeImage}=require('electron')
const bitmap=Buffer.alloc(32*32*4);for(let i=0;i<bitmap.length;i+=4){bitmap[i]=255;bitmap[i+3]=255}
library.graphs[0].data.characters[0].avatar=nativeImage.createFromBitmap(bitmap,{width:32,height:32}).toDataURL()
fs.writeFileSync(path.join(profile,'workspace/library.json'),JSON.stringify(library))
app.setPath('userData',profile);app.setPath('sessionData',path.join(root,'session'))
app.on('browser-window-created',(_,win)=>{win.hide();win.webContents.once('did-finish-load',async()=>{
  try{
    await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{let n=0;const id=setInterval(()=>{if(document.body.innerText.includes('已自动保存')&&document.querySelector('.graph-engine canvas')){clearInterval(id);resolve()}else if(++n>150){clearInterval(id);reject(new Error('UI timed out'))}},50)})`)
    assert.equal(await win.webContents.executeJavaScript('document.title'),'织灵 · 角色关系网')
    const loaded=await win.webContents.executeJavaScript('window.desktop.load()');assert.equal(loaded.data.graphs.length,1)
    assert.equal(loaded.data.graphs[0].data.relations[0].label,'母亲/女儿')
    assert.equal(loaded.data.graphs[0].data.relations[0].mode,undefined)
    assert.equal(loaded.data.layoutDensity,1)
    const baselineDistance=await win.webContents.executeJavaScript(`(() => {const cy=document.querySelector('.graph-engine')._cyreg.cy,a=cy.$id('c:a').position(),b=cy.$id('c:b').position();return Math.hypot(b.x-a.x,b.y-a.y)})()`)
    await win.webContents.executeJavaScript(`document.querySelector('[aria-label="图谱设置"]').click()`)
    await win.webContents.executeJavaScript(`document.querySelector('[aria-label="排列稀疏程度 5 档"]').click()`)
    const expandedDistance=await win.webContents.executeJavaScript(`(() => {const cy=document.querySelector('.graph-engine')._cyreg.cy,a=cy.$id('c:a').position(),b=cy.$id('c:b').position();return Math.hypot(b.x-a.x,b.y-a.y)})()`)
    assert(Math.abs(expandedDistance/baselineDistance-1.8)<1e-6)
    await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{let n=0;const id=setInterval(async()=>{if((await window.desktop.load()).data.layoutDensity===5){clearInterval(id);resolve()}else if(++n>100){clearInterval(id);reject(new Error('Density save timed out'))}},50)})`)
    await win.webContents.executeJavaScript(`document.querySelector('[aria-label="关闭对话框"]').click()`)
    const beforeExport=await win.webContents.executeJavaScript(`(() => {
      const cy=document.querySelector('.graph-engine')._cyreg.cy;
      cy.stop(true,false);cy.$id('c:a').position({x:0,y:0});cy.$id('c:b').position({x:480,y:200});
      cy.$id('c:b').emit('dragfree');cy.fit();
      return JSON.stringify({nodes:cy.nodes().map(n=>({...n.position()})),pan:cy.pan(),zoom:cy.zoom()});
    })()`)
    dialog.showSaveDialog=async()=>({canceled:false,filePath:path.join(root,'whole-graph.png')})
    await win.webContents.executeJavaScript(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim().startsWith('导出图片')).click()`)
    const deadline=Date.now()+20000;while(!fs.existsSync(path.join(root,'whole-graph.png'))){if(Date.now()>deadline)throw new Error('PNG export timed out');await new Promise(r=>setTimeout(r,50))}
    const png=fs.readFileSync(path.join(root,'whole-graph.png'));assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a')
    const afterExport=await win.webContents.executeJavaScript(`(() => { const cy=document.querySelector('.graph-engine')._cyreg.cy; return JSON.stringify({nodes:cy.nodes().map(n=>({...n.position()})),pan:cy.pan(),zoom:cy.zoom()}); })()`)
    assert.equal(afterExport,beforeExport,'PNG export must preserve the live viewport and manually placed nodes')
    assert(png.readUInt32BE(16)>png.readUInt32BE(20),'PNG must retain the manually arranged wide layout')
    const exportedBitmap=nativeImage.createFromBuffer(png).toBitmap();let bluePixels=0
    for(let i=0;i<exportedBitmap.length;i+=4)if(exportedBitmap[i]>230&&exportedBitmap[i+1]<25&&exportedBitmap[i+2]<25)bluePixels++
    assert(bluePixels>1000,'PNG must include the actual avatar image')
    await win.webContents.executeJavaScript(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()==='保存').click()`)
    await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{let n=0;const id=setInterval(async()=>{const d=(await window.desktop.load()).data;if(d.localLayouts?.s?.b?.x===480&&d.localLayouts?.s?.b?.y===200){clearInterval(id);resolve()}else if(++n>100){clearInterval(id);reject(new Error('Layout save timed out'))}},50)})`)
    // Exercise the native bridge and actual filesystem destinations with isolated paths.
    const imageDir=path.join(root,'images'),jsonDir=path.join(root,'json')
    fs.mkdirSync(imageDir,{recursive:true});fs.mkdirSync(jsonDir,{recursive:true})
    await win.webContents.executeJavaScript(`window.desktop.setExportSetting('png',{directory:${JSON.stringify(imageDir)},ask:false})`)
    await win.webContents.executeJavaScript(`window.desktop.setExportSetting('json',{directory:${JSON.stringify(jsonDir)},ask:false})`)
    const preferences=await win.webContents.executeJavaScript('window.desktop.getExportSettings()')
    assert.equal(preferences.png.directory,imageDir);assert.equal(preferences.json.directory,jsonDir)
    dialog.showSaveDialog=async()=>{throw new Error('Automatic export must not ask for a location')}
    await win.webContents.executeJavaScript(`window.desktop.exportJson({version:1,title:'自动备份',characters:[],relations:[]})`)
    await win.webContents.executeJavaScript(`window.desktop.exportJson({version:1,title:'自动备份',characters:[],relations:[]})`)
    assert(fs.existsSync(path.join(jsonDir,'自动备份.json')));assert(fs.existsSync(path.join(jsonDir,'自动备份 (2).json')))
    await win.webContents.executeJavaScript(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim().startsWith('导出图片')).click()`)
    const autoPng=path.join(imageDir,'合成图谱测试-完整关系网.png'),autoDeadline=Date.now()+10000
    while(!fs.existsSync(autoPng)){if(Date.now()>autoDeadline)throw new Error('Automatic PNG timed out');await new Promise(r=>setTimeout(r,50))}
    await win.webContents.executeJavaScript(`window.desktop.setExportSetting('json',{directory:${JSON.stringify(jsonDir)},ask:true})`)
    let asked=false
    dialog.showSaveDialog=async(_,options)=>{asked=true;assert.equal(path.dirname(options.defaultPath),jsonDir);return {canceled:true}}
    assert.equal(await win.webContents.executeJavaScript(`window.desktop.exportJson({version:1,title:'取消导出'})`),false);assert(asked)
    await win.webContents.executeJavaScript(`document.querySelector('[aria-label="全屏"]').click()`)
    const fullDeadline=Date.now()+5000
    while(!win.isFullScreen()){if(Date.now()>fullDeadline)throw new Error('Native fullscreen timed out');await new Promise(r=>setTimeout(r,50))}
    assert(await win.webContents.executeJavaScript(`new Promise(resolve=>setTimeout(()=>resolve(document.querySelector('.app-shell').classList.contains('graph-fullscreen')&&[...document.querySelectorAll('.app-header,.sidebar,.status-bar,.canvas-controls')].every(e=>!e.getBoundingClientRect().height)),100))`))
    await win.webContents.executeJavaScript(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`)
    await new Promise(r=>setTimeout(r,200));assert.equal(win.isFullScreen(),false)
    const all={...library,graphs:Array.from({length:120},(_,i)=>({...library.graphs[0],id:'s'+i,data:{...library.graphs[0].data,title:'测试'+i}})),activeId:'s119'}
    await win.webContents.executeJavaScript(`window.desktop.save(${JSON.stringify(all)})`)
    const restored=await win.webContents.executeJavaScript('window.desktop.load()');assert.equal(restored.data.graphs.length,120)
    fs.writeFileSync(path.join(root,'result.json'),JSON.stringify({passed:true,nativeFullscreen:true,exportPreferences:true,automaticPng:true,automaticJson:true,collisionSafe:true,graphs:120,pngBytes:png.length,pngWidth:png.readUInt32BE(16),pngHeight:png.readUInt32BE(20)},null,2))
    console.log('PASS: packaged desktop renderer, paired labels, 120 graph persistence and actual PNG file export.');app.exit(0)
  }catch(e){try{fs.writeFileSync(path.join(root,'failure-ui.txt'),await win.webContents.executeJavaScript('document.body.innerText'))}catch{}fs.writeFileSync(path.join(root,'failure.txt'),e.stack);console.error(e);app.exit(1)}
})})
require(path.join(process.env.ZHILING_PACKAGED_DIR||path.resolve(__dirname,'../release/win-unpacked'),'resources/app.asar/electron/main.cjs'))
setTimeout(()=>app.exit(1),45000).unref()
