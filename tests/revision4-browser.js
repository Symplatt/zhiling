await page.goto('http://127.0.0.1:5192',{waitUntil:'networkidle'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await expect(page.locator('.status-bar')).toContainText('已自动保存');
const fixture={version:1,title:'配色与高亮验证',characters:[{id:'a',name:'青禾'},{id:'b',name:'月白'},{id:'c',name:'星河'},{id:'d',name:'流萤'}],relations:[
 {id:'ab',from:'a',to:'b',label:'母亲',reverseLabel:'女儿',mode:'paired',direction:'two-way'},
 {id:'ca',from:'c',to:'a',label:'师父',direction:'one-way'},
 {id:'bd',from:'b',to:'d',label:'朋友',direction:'two-way'},
]};
await page.locator('input[type=file]').setInputFiles({name:'legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
await page.getByRole('button',{name:'确认导入',exact:true}).click();
await page.locator('.character-item').filter({hasText:'青禾'}).click();
await page.locator('.relation-row').filter({hasText:'母亲/女儿'}).click();
await page.getByRole('button',{name:'编辑关系',exact:true}).click();
const dialog=page.getByRole('dialog');
await expect(dialog.locator('input')).toHaveCount(1);
await expect(dialog.getByRole('textbox',{name:'关系名称',exact:true})).toHaveValue('母亲/女儿');
await expect(dialog).not.toContainText('共同关系');await expect(dialog).not.toContainText('区别双方');
await dialog.getByRole('textbox',{name:'关系名称',exact:true}).fill('母女');
await page.getByRole('button',{name:'保存关系',exact:true}).click();
await expect(page.locator('.relation-profile h2')).toHaveText('母女');
await page.getByRole('button',{name:'添加角色',exact:true}).first().click();
await page.getByRole('textbox',{name:'角色名称'}).fill('云岚');
await page.locator('summary').filter({hasText:'初始关系'}).click();
await page.getByRole('combobox',{name:'关联角色',exact:true}).selectOption('a');
await page.getByRole('textbox',{name:'关系名称',exact:true}).fill('同门');
await expect(dialog).not.toContainText('双向关系方式');
await dialog.getByRole('button',{name:'添加角色',exact:true}).click();
await expect(page.locator('.status-bar')).toContainText('5 位角色');
await page.locator('.character-item').filter({hasText:'青禾'}).click();
await page.getByRole('button',{name:'关闭详情',exact:true}).click();
await page.getByRole('button',{name:'自动布局',exact:true}).click();
const themes=[];
for(const [name,background] of [['黑白灰','#e4e5e7'],['桃粉','#eddee3'],['浅草','#fafcf7'],['金夜','#1c1d24'],['碧蓝','#dee8ef']]){
 await page.getByRole('button',{name:'图谱设置'}).click();
 await page.locator('.theme-card').filter({hasText:name}).click();
 await page.getByRole('button',{name:'完成',exact:true}).click();
 const state=await page.locator('.graph-engine').evaluate(el=>{
  const cy=el._cyreg.cy,a=cy.$id('c:a'),b=cy.$id('c:b');
  return {paper:getComputedStyle(el).getPropertyValue('--paper').trim(),outline:a.style('outline-width'),offset:a.style('outline-offset'),halo:a.style('underlay-opacity'),neighborOutline:b.style('outline-width'),neighborHalo:b.style('underlay-opacity'),labelWeight:cy.$id('r:ab').style('font-weight')};
 });
 assert.equal(state.paper,background);assert.equal(state.outline,'1.2px');assert.equal(state.offset,'5px');assert(Number(state.halo)<0.1);assert.equal(state.neighborOutline,'0px');assert.equal(state.neighborHalo,'0');
 themes.push({name,...state});
}
await expect(page.locator('.status-bar')).toContainText('已自动保存');
const saved=await page.evaluate(async()=>(await(await fetch('/api/library')).json()).data);
const active=saved.graphs.find(g=>g.id===saved.activeId).data;
assert.equal(active.relations[0].label,'母女');assert(!('mode' in active.relations[0]));assert(!('reverseLabel' in active.relations[0]));
assert(active.relations.some(r=>r.label==='同门'&&r.direction==='two-way'));
await page.reload({waitUntil:'networkidle'});await page.locator('.character-item').filter({hasText:'青禾'}).click();
await page.getByRole('button',{name:'关闭详情',exact:true}).click();await page.getByRole('button',{name:'自动布局',exact:true}).click();
expect(errors).toEqual([]);
return {passed:true,themes,legacyMigration:true,singleInput:true,initialRelation:true,screenshot:await page.screenshot({fullPage:false})};
