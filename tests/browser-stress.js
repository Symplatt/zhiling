const checks = [];
const fixture = {
  version:1, title:'500 角色压力检查',
  characters:Array.from({length:500},(_,i)=>({id:`n${i}`,name:`人物${i}`,group:`阵营${i%5}`,color:['#4f8072','#a97f5c','#8480a7','#678ca3','#b27081'][i%5]})),
  relations:Array.from({length:499},(_,i)=>({from:`n${Math.floor(i/3)}`,to:`n${i+1}`,label:'关联',direction:i%2?'two-way':'one-way'}))
};
const before=Date.now();
await page.locator('input[type=file][accept=".json,application/json"]').setInputFiles({name:'500-characters.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
await page.getByRole('button',{name:'确认导入',exact:true}).click();
await expect(page.locator('.status-bar')).toContainText('500 位角色');
await expect(page.locator('.graph-canvas canvas').first()).toBeVisible();
const metrics=await page.locator('.graph-canvas').evaluate(el=>{
  const cy=el._cyreg.cy;
  const nodes=cy.nodes().map(n=>({id:n.id(),pos:n.position(),w:n.width(),h:n.height()}));
  let overlaps=0,nonFinite=0;
  for(let i=0;i<nodes.length;i++){
    const a=nodes[i];if(!Number.isFinite(a.pos.x)||!Number.isFinite(a.pos.y))nonFinite++;
    for(let j=i+1;j<nodes.length;j++){
      const b=nodes[j];
      if(Math.hypot(a.pos.x-b.pos.x,a.pos.y-b.pos.y)<(a.w+b.w)/2)overlaps++;
    }
  }
  return {nodes:nodes.length,edges:cy.edges().length,overlaps,nonFinite};
});
expect(metrics.nodes).toBe(500);expect(metrics.edges).toBe(499);expect(metrics.overlaps).toBe(0);expect(metrics.nonFinite).toBe(0);
checks.push({test:'500 nodes / 499 edges',...metrics,importAndLayoutMs:Date.now()-before});
await page.getByRole('combobox',{name:'按阵营筛选'}).selectOption('阵营2');
await expect(page.locator('.character-item')).toHaveCount(100);
const filtered=await page.locator('.graph-canvas').evaluate(el=>({visible:el._cyreg.cy.nodes(':visible').length}));
expect(filtered.visible).toBe(100);
checks.push({test:'500-node filtering',...filtered});
await page.locator('input[type=file][accept=".json,application/json"]').setInputFiles({name:'restore.json',mimeType:'application/json',buffer:Buffer.from(globalThis.originalAtlas)});
await page.getByRole('button',{name:'确认导入',exact:true}).click();
await page.getByRole('button',{name:'编辑档案',exact:true}).click();
const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9ioAAAAASUVORK5CYII=';
await page.locator('input[type=file][accept="image/png,image/jpeg,image/webp,image/gif"]').setInputFiles({name:'avatar.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
await expect(page.getByAltText('头像预览')).toBeVisible();
await page.getByRole('button',{name:'保存修改',exact:true}).click();
await expect(page.locator('.profile-avatar img')).toBeVisible();
const avatar=await page.locator('.graph-canvas').evaluate(el=>el._cyreg.cy.nodes().first().data('avatar'));
expect(avatar.startsWith('data:image/png;base64,')).toBeTruthy();
checks.push({test:'avatar embedded in Cytoscape and profile',passed:true});
await page.getByRole('button',{name:'编辑档案',exact:true}).click();
await page.getByRole('button',{name:'移除头像',exact:true}).click();
await page.getByRole('button',{name:'保存修改',exact:true}).click();
await page.evaluate(()=>{
  const original=URL.createObjectURL;
  URL.createObjectURL=function(blob){window.__atlasExport=blob.text();return original.call(URL,blob)};
});
await page.getByRole('button',{name:'导出',exact:true}).click();
await expect(page.getByRole('status')).toContainText('JSON 已导出');
const exported=JSON.parse(await page.evaluate(()=>window.__atlasExport));
expect(exported.characters.length).toBe(12);
expect(exported.relations.length).toBe(18);
expect(exported.title).toBe('云川旧事');
checks.push({test:'exported JSON content',characters:exported.characters.length,relations:exported.relations.length});
return {checks,errors:globalThis.atlasErrors};
