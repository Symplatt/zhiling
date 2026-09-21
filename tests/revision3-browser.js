// Run only against the isolated synthetic library served on port 5191.
await page.goto('http://127.0.0.1:5191', {waitUntil:'networkidle'});
const errors=[]; globalThis.revision3Errors=errors;
page.on('pageerror', e=>errors.push(e.message));
await expect(page.locator('.status-bar')).toContainText('已自动保存');
const results=[];
const fixture={version:1,title:'交互验证 · 合成故事',description:'旧简介待迁移',characters:[
  {id:'a',name:'青禾',group:'一组'}, {id:'b',name:'月白',group:'一组'},
  {id:'c',name:'星河',group:'二组'}, {id:'d',name:'流萤',group:'二组'},
  {id:'e',name:'云岚',group:'三组'}, {id:'f',name:'山隐',group:'三组'},
],relations:[
  {id:'ab',from:'a',to:'b',label:'母亲',reverseLabel:'女儿',mode:'paired',direction:'two-way',description:'两人的关系描述'},
  {id:'ca',from:'c',to:'a',label:'师父',direction:'one-way'},
  {id:'ac',from:'a',to:'c',label:'朋友',direction:'two-way'},
  {id:'bd',from:'b',to:'d',label:'朋友',direction:'two-way'},
  {id:'ef',from:'e',to:'f',label:'同门',direction:'two-way'},
]};
await page.locator('input[type=file]').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
await page.getByRole('button',{name:'确认导入',exact:true}).click();
await expect(page.locator('.status-bar')).toContainText('6 位角色');
await expect(page.locator('.graph-header, .graph-toolbar')).toHaveCount(0);
await expect(page.locator('.sidebar').getByRole('button',{name:'自动布局'})).toBeVisible();
await expect(page.locator('.app-header').getByRole('button',{name:'图谱设置'})).toBeVisible();
assert(await page.locator('.app-header button').filter({hasText:'导入(Json)'}).locator('svg.lucide-download').count());
assert(await page.locator('.app-header button').filter({hasText:'导出(Json)'}).locator('svg.lucide-upload').count());
const geometry=await page.evaluate(()=>{
 const c=document.querySelector('.canvas-wrap').getBoundingClientRect(),h=document.querySelector('.app-header').getBoundingClientRect(),app=document.querySelector('.app-shell').getBoundingClientRect();
 return {canvasTop:c.top,headerBottom:h.bottom,appRight:app.right,width:innerWidth};
});
assert(Math.abs(geometry.canvasTop-geometry.headerBottom)<2);
assert(Math.abs(geometry.appRight-geometry.width)<2);
results.push('工具迁入导航，图谱紧接顶部，导入导出图标已更正，无右侧空白');
const graph=()=>page.locator('.graph-engine');
async function nodePoint(id){return graph().evaluate((el,id)=>{const n=el._cyreg.cy.getElementById('c:'+id),p=n.renderedPosition(),r=el.getBoundingClientRect();return{x:r.x+p.x,y:r.y+p.y};},id);}
const p=await nodePoint('a');await page.mouse.click(p.x,p.y);
await expect(page.locator('.profile h2')).toHaveText('青禾');
let state=await graph().evaluate(el=>{const cy=el._cyreg.cy;return {chosen:cy.nodes('.chosen').map(n=>n.id()),neighbors:cy.nodes('.neighbor').map(n=>n.id()).sort(),edges:cy.edges('.connected').map(n=>n.id()).sort(),font:cy.edges().first().style('font-size'),a:cy.$id('c:a').style('underlay-opacity'),b:cy.$id('c:b').style('underlay-opacity')};});
expect(state.chosen).toEqual(['c:a']);expect(state.neighbors).toEqual(['c:b','c:c']);expect(state.edges).toEqual(['r:ab','r:ac','r:ca']);
assert.equal(state.font,'15px');assert(Number(state.a)>Number(state.b));
results.push('实际点击圆圈：主角色强高亮，全部入边/出边/多重关系及一度角色弱高亮，关系字号15px');
await page.getByRole('button',{name:'关闭详情',exact:true}).click();
await page.getByRole('button',{name:'自动布局',exact:true}).click();
const before=await graph().evaluate(el=>el._cyreg.cy.zoom());
const box=await graph().boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.wheel(0,-120);
await expect.poll(()=>graph().evaluate(el=>el._cyreg.cy.zoom())).toBeGreaterThan(before*1.25);
const after=await graph().evaluate(el=>el._cyreg.cy.zoom());
results.push(`滚轮单次 -120：缩放 ${Math.round(before*100)}% → ${Math.round(after*100)}%`);
await page.getByRole('button',{name:'重命名关系网'}).click();
await expect(page.getByRole('dialog').locator('input')).toHaveCount(1);
await page.getByRole('textbox',{name:'关系网名称'}).fill('验证后的故事');
await page.getByRole('button',{name:'保存信息',exact:true}).click();
await expect(page.locator('.project-title')).toContainText('验证后的故事');
await page.getByRole('button',{name:'添加角色',exact:true}).first().click();
const modal=await page.getByRole('dialog').boundingBox(),viewport=await page.evaluate(()=>({w:innerWidth,h:innerHeight}));
assert(Math.abs(modal.x+modal.width/2-viewport.w/2)<3);assert(Math.abs(modal.y+modal.height/2-viewport.h/2)<3);
await page.getByRole('textbox',{name:'角色名称'}).fill('测试角色');await page.getByRole('textbox',{name:'角色标签'}).fill('侠客 仙子 金丹后期');
await page.getByRole('dialog').getByRole('button',{name:'添加角色',exact:true}).click();
await expect(page.locator('.tags span')).toHaveText(['侠客','仙子','金丹后期']);
await page.getByRole('button',{name:'撤销',exact:true}).click();await expect(page.locator('.status-bar')).toContainText('6 位角色');
await page.getByRole('button',{name:'重做',exact:true}).click();await expect(page.locator('.status-bar')).toContainText('7 位角色');
results.push('拆分后角色新增、标签、撤销重做、名称编辑正常，表单保持居中');
await page.getByRole('button',{name:'添加关系',exact:true}).click();
await page.getByRole('button',{name:'双向关系',exact:false}).click();
await expect(page.getByRole('dialog').locator('input')).toHaveCount(1);
await page.getByRole('textbox',{name:'关系名称',exact:true}).fill('姐姐/妹妹');
await page.getByRole('button',{name:'保存关系',exact:true}).click();
await expect(page.locator('.relation-profile h2')).toHaveText('姐姐/妹妹');
for (const [name,id] of [['黑白灰','mono'],['浅草','grass'],['桃粉','pink'],['碧蓝','blue'],['金夜','gold']]) {
 await page.getByRole('button',{name:'图谱设置',exact:true}).click();
 await page.locator('.theme-card').filter({hasText:name}).click();
 await page.getByRole('button',{name:'完成',exact:true}).click();
 await expect(page.locator('html')).toHaveAttribute('data-theme',id);
}
await page.locator('.character-item').filter({hasText:'青禾'}).click();
const gold=await graph().evaluate(el=>{const cy=el._cyreg.cy;return {line:cy.$id('r:ab').style('line-color'),base:cy.edges().filter(e=>!e.hasClass('connected')).first().style('line-color')};});
assert.notEqual(gold.line,gold.base);
results.push('单输入栏双向关系与五主题正常，高亮颜色跟随主题');
await page.evaluate(()=>{const original=URL.createObjectURL;window.testPng=null;URL.createObjectURL=function(blob){if(blob.type==='image/png')window.testPng=blob;return original.call(this,blob);};});
await page.getByRole('combobox',{name:'按阵营筛选'}).selectOption('一组');
await page.getByRole('button',{name:'导出图片(png)',exact:true}).click();
await page.waitForFunction(()=>window.testPng instanceof Blob);
const exported=await page.evaluate(async()=>{const blob=window.testPng,bmp=await createImageBitmap(blob);return{bytes:blob.size,width:bmp.width,height:bmp.height};});
assert(exported.bytes>1000);assert(exported.width>100&&exported.height>100);
await page.getByRole('combobox',{name:'按阵营筛选'}).selectOption('');
await expect(page.locator('.status-bar')).toContainText('已自动保存');
const saved=await page.evaluate(async()=>(await(await fetch('/api/library')).json()).data);
const current=saved.graphs.find(g=>g.id===saved.activeId).data;
assert(!('description' in current));assert.equal(current.relations[0].description,'两人的关系描述');
await page.reload({waitUntil:'networkidle'});await expect(page.locator('.project-title')).toContainText('验证后的故事');
await expect(page.locator('html')).toHaveAttribute('data-theme','gold');
await page.locator('.character-item').filter({hasText:'青禾'}).click();
await page.getByRole('button',{name:'关闭详情',exact:true}).click();await page.getByRole('button',{name:'自动布局',exact:true}).click();
results.push('筛选状态下整图PNG导出成功，保存重载保留数据和主题、移除网络简介但保留关系描述');
expect(errors).toEqual([]);
return {results,exported,screenshot:await page.screenshot({fullPage:false})};
