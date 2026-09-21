await page.goto('http://127.0.0.1:5193',{waitUntil:'networkidle'});
await expect(page.locator('.status-bar')).toContainText('已自动保存');
const fixture={version:1,title:'本人标记验证',characters:[{id:'a',name:'云栖月'},{id:'b',name:'本人'},{id:'c',name:'梓夜'}],relations:[
 {id:'ab',from:'a',to:'b',label:'朋友',direction:'two-way'},
 {id:'ca',from:'c',to:'a',label:'徒弟',direction:'one-way'},
 {id:'aa',from:'a',to:'a',label:'自省',direction:'one-way'},
]};
await page.locator('input[type=file]').setInputFiles({name:'synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
await page.getByRole('button',{name:'确认导入',exact:true}).click();
await page.getByRole('button',{name:'图谱设置'}).click();await page.locator('.theme-card').filter({hasText:'金夜'}).click();await page.getByRole('button',{name:'完成',exact:true}).click();
await page.locator('.character-item').filter({hasText:'云栖月'}).click();
const header=page.locator('.inspector-header');
await expect(header.getByRole('button',{name:'编辑档案',exact:true})).toBeVisible();
await expect(page.locator('.profile').getByRole('button',{name:'编辑档案',exact:true})).toHaveCount(0);
const edit=await header.getByRole('button',{name:'编辑档案',exact:true}).boundingBox(),close=await header.getByRole('button',{name:'关闭详情',exact:true}).boundingBox();
assert(edit.x+edit.width<=close.x);assert(Math.abs(edit.y+edit.height/2-close.y-close.height/2)<2);
await expect(page.locator('.self-reference')).toHaveCount(4);
await expect(page.locator('.endpoint-name').filter({hasText:/^本人$/})).toHaveCount(1);
for(const marker of await page.locator('.self-reference').all()){
 await expect(marker).toHaveText('〔本人〕');await expect(marker).toHaveAttribute('title','指代当前角色：云栖月（非角色姓名）');
}
await header.getByRole('button',{name:'编辑档案',exact:true}).click();await expect(page.getByRole('textbox',{name:'角色名称'})).toHaveValue('云栖月');await page.getByRole('button',{name:'取消',exact:true}).click();
const inspectorScreenshot=await page.screenshot({fullPage:false});
await page.locator('.character-item').filter({hasText:/^本人/}).click();await expect(page.locator('.profile h2')).toHaveText('本人');
await expect(page.locator('.self-reference')).toHaveCount(1);await expect(page.locator('.endpoint-name')).toHaveText('云栖月');
await page.getByRole('button',{name:'使用帮助'}).click();await expect(page.getByRole('dialog')).toContainText('作者：Symplatt');
const helpScreenshot=await page.screenshot({fullPage:false});
return {passed:true,alignedEditAndClose:true,realCharacterNamed本人:true,incomingOutgoingAndSelfLoop:true,author:'Symplatt',inspectorScreenshot,helpScreenshot};
