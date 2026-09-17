import { it, expect } from 'vitest'
import { mkdtemp,readFile,writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createRequire } from 'node:module'
import { createLibrary,story } from '../src/library'
import { createSample } from '../src/sample'
const {LibraryStore}=createRequire(import.meta.url)('../server/store.cjs')
it('120 张关系网真实落盘、重启恢复、版本冲突保护及备份恢复',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'zhiling-store-test-')),store=new LibraryStore(dir),data=createLibrary(createSample())
  data.graphs=Array.from({length:120},(_,i)=>story({...createSample(),title:`故事${i}`}));data.activeId=data.graphs[110]!.id
  expect((await store.save(data,0)).revision).toBe(1)
  const restored=await new LibraryStore(dir).load();expect(restored.data.graphs.length).toBe(120);expect(restored.data.activeId).toBe(data.activeId)
  await expect(store.save(data,0)).rejects.toThrow('另一个窗口')
  await store.save({...data,theme:'pink'},1);expect(JSON.parse(await readFile(join(dir,'library.json.bak'),'utf8')).theme).toBe('grass')
  await writeFile(join(dir,'library.json'),'broken');const recovered=await store.load();expect(recovered.error).toContain('备份');expect(recovered.data.graphs.length).toBe(120)
})
