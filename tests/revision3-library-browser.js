// A task-owned scratch tab; never change the user's retained tab viewport.
const scratch=await context.newPage();
try {
  await scratch.setViewportSize({width:900,height:720});
  await scratch.goto('http://127.0.0.1:5191',{waitUntil:'networkidle'});
  await expect(scratch.locator('.status-bar')).toContainText('已自动保存');
  const chooser=scratch.waitForEvent('filechooser');
  await scratch.getByRole('button',{name:'导入(Json)',exact:true}).click();
  const fileChooser=await chooser;
  const fixture={version:2,activeId:'g0',theme:'grass',graphs:Array.from({length:120},(_,i)=>({id:'g'+i,updatedAt:new Date().toISOString(),data:{version:1,title:'容量验证-'+i,description:'旧版简介',characters:[],relations:[]}}))};
  await fileChooser.setFiles({name:'120-graphs.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
  await scratch.getByRole('button',{name:'确认导入',exact:true}).click();
  await expect(scratch.locator('.project-title')).toContainText('容量验证-0');
  await scratch.getByTitle('切换关系网',{exact:true}).click();
  await scratch.getByRole('textbox',{name:'搜索关系网',exact:true}).fill('容量验证-119');
  await expect(scratch.locator('.book-open')).toHaveCount(1);
  await scratch.locator('.book-open').click();
  await scratch.reload({waitUntil:'networkidle'});
  await expect(scratch.locator('.project-title')).toContainText('容量验证-119');
  await scratch.getByTitle('切换关系网',{exact:true}).click();
  await scratch.getByRole('button',{name:'新建关系网',exact:true}).click();
  await expect(scratch.getByRole('dialog').locator('input')).toHaveCount(1);
  await scratch.getByRole('textbox',{name:'关系网名称'}).fill('新建验证');
  await scratch.getByRole('button',{name:'创建关系网',exact:true}).click();
  await expect(scratch.locator('.project-title')).toHaveText('新建验证');
  await scratch.getByRole('button',{name:'添加角色',exact:true}).first().click();
  const b=await scratch.getByRole('dialog').boundingBox();
  assert(Math.abs(b.x+b.width/2-450)<3&&Math.abs(b.y+b.height/2-360)<3);
  assert(b.y>0&&b.y+b.height<720);
  const header=await scratch.locator('.header-actions').boundingBox();assert(header.x+header.width<=900);
  return {passed:true,imported:120,selected:'容量验证-119',viewport:'900×720',modal:b,screenshot:await scratch.screenshot({fullPage:false})};
} finally {await scratch.close();}
