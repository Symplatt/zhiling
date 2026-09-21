assert.equal(page.url(),'http://127.0.0.1:5193/');
await page.locator('.character-item').filter({hasText:'云栖月'}).click();
const header=page.locator('.inspector-header');
await expect(header.getByRole('button',{name:'编辑档案',exact:true})).toBeVisible();
await expect(page.locator('.profile .edit-profile')).toHaveCount(0);
const edit=await header.getByRole('button',{name:'编辑档案',exact:true}).boundingBox(),close=await header.getByRole('button',{name:'关闭详情',exact:true}).boundingBox();
assert(edit.x+edit.width<=close.x);assert(Math.abs(edit.y+edit.height/2-close.y-close.height/2)<2);
await expect(page.locator('.self-reference')).toHaveCount(4);
await expect(page.locator('.endpoint-name').filter({hasText:/^本人$/})).toHaveCount(1);
for(const marker of await page.locator('.self-reference').all()){
 await expect(marker).toHaveText('〔本人〕');await expect(marker).toHaveAttribute('title','指代当前角色：云栖月（非角色姓名）');
}
const screenshot=await page.screenshot({fullPage:false});
await page.locator('.character-item').filter({hasText:'本人'}).click();
await expect(page.locator('.profile h2')).toHaveText('本人');
await expect(page.locator('.self-reference')).toHaveCount(1);
await expect(page.locator('.endpoint-name')).toHaveText('云栖月');
return {passed:true,headerAlignment:true,incomingOutgoingSelfLoop:true,realName本人Distinguished:true,screenshot};
