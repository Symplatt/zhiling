import { expect, it } from 'vitest'
import { createLibrary, parseLibrary, story } from '../src/library'
import { createSample } from '../src/sample'
it('保存并恢复 120 张独立关系网与主题',()=>{
  const library=createLibrary(createSample())
  library.graphs=Array.from({length:120},(_,i)=>story({...createSample(),title:`小说${i}`}))
  library.activeId=library.graphs[100]!.id;library.theme='gold'
  const restored=parseLibrary(JSON.parse(JSON.stringify(library)))
  expect(restored.graphs.length).toBe(120);expect(restored.graphs.find(s=>s.id===restored.activeId)!.data.title).toBe('小说100');expect(restored.theme).toBe('gold')
  restored.graphs[0]!.data.characters[0]!.name='更名';expect(restored.graphs[1]!.data.characters[0]!.name).toBe('花盈')
})
it('迁移 v1 单图、删除头像，并拒绝重复书架 ID',()=>{
  const legacy=createSample();legacy.characters[0]!.avatar='images/x.png'
  const library=parseLibrary(legacy);expect(library.graphs.length).toBe(1);expect(library.graphs[0]!.data.characters[0]!.avatar).toBeUndefined()
  library.graphs.push(library.graphs[0]!);expect(()=>parseLibrary(library)).toThrow('重复')
})
