const {app,dialog}=require('electron'),path=require('node:path'),fs=require('node:fs'),assert=require('node:assert/strict')
const root=path.resolve(__dirname,process.env.ZHILING_TEST_DIR||'../test-results/revision3-desktop'),profile=path.join(root,'profile')
fs.mkdirSync(path.join(profile,'workspace'),{recursive:true})
const pngPath=path.join(root,'whole-graph.png');if(fs.existsSync(pngPath))fs.unlinkSync(pngPath)
const library={version:2,revision:1,activeId:'s',theme:'grass',graphs:[{id:'s',updatedAt:new Date().toISOString(),data:{version:1,title:'合成图谱测试',description:'',characters:[{id:'a',name:'青禾'},{id:'b',name:'月白'}],relations:[{id:'r',from:'a',to:'b',label:'母亲',reverseLabel:'女儿',mode:'paired',direction:'two-way'}]}}]}
fs.writeFileSync(path.join(profile,'workspace/library.json'),JSON.stringify(library))
app.setPath('userData',profile);app.setPath('sessionData',path.join(root,'session'))
app.on('browser-window-created',(_,win)=>{win.hide();win.webContents.once('did-finish-load',async()=>{
  try{
    await win.webContents.executeJavaScript(`new Promise((resolve,reject)=>{let n=0;const id=setInterval(()=>{if(document.body.innerText.includes('已自动保存')&&document.querySelector('.graph-engine canvas')){clearInterval(id);resolve()}else if(++n>150){clearInterval(id);reject(new Error('UI timed out'))}},50)})`)
    assert.equal(await win.webContents.executeJavaScript('document.title'),'织灵 · 角色关系网')
    const loaded=await win.webContents.executeJavaScript('window.desktop.load()');assert.equal(loaded.data.graphs.length,1)
    assert.equal(loaded.data.graphs[0].data.relations[0].label,'母亲/女儿')
    assert.equal(loaded.data.graphs[0].data.relations[0].mode,undefined)
    dialog.showSaveDialog=async()=>({canceled:false,filePath:path.join(root,'whole-graph.png')})
    await win.webContents.executeJavaScript(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim().startsWith('导出图片')).click()`)
    const deadline=Date.now()+10000;while(!fs.existsSync(path.join(root,'whole-graph.png'))){if(Date.now()>deadline)throw new Error('PNG export timed out');await new Promise(r=>setTimeout(r,50))}
    const png=fs.readFileSync(path.join(root,'whole-graph.png'));assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a')
    const all={...library,graphs:Array.from({length:120},(_,i)=>({...library.graphs[0],id:'s'+i,data:{...library.graphs[0].data,title:'测试'+i}})),activeId:'s119'}
    await win.webContents.executeJavaScript(`window.desktop.save(${JSON.stringify(all)})`)
    const restored=await win.webContents.executeJavaScript('window.desktop.load()');assert.equal(restored.data.graphs.length,120)
    fs.writeFileSync(path.join(root,'result.json'),JSON.stringify({passed:true,graphs:120,pngBytes:png.length,pngWidth:png.readUInt32BE(16),pngHeight:png.readUInt32BE(20)},null,2))
    console.log('PASS: packaged desktop renderer, paired labels, 120 graph persistence and actual PNG file export.');app.exit(0)
  }catch(e){fs.writeFileSync(path.join(root,'failure.txt'),e.stack);console.error(e);app.exit(1)}
})})
require('../release/win-unpacked/resources/app.asar/electron/main.cjs')
setTimeout(()=>app.exit(1),30000).unref()
