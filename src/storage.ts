import type { Library } from './library'
let backend: 'desktop' | 'server' | 'browser' = 'browser', revision = 0
let queue: Promise<unknown> = Promise.resolve()
function database(): Promise<IDBDatabase> { return new Promise((resolve, reject) => {
  const request = indexedDB.open('zhiling-library', 1)
  request.onupgradeneeded = () => request.result.createObjectStore('workspace')
  request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error)
}) }
async function browserRead(): Promise<unknown | null> {
  const db = await database()
  return new Promise((resolve,reject) => { const tx=db.transaction('workspace');const req=tx.objectStore('workspace').get('library');req.onsuccess=()=>resolve(req.result || null);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close() })
}
async function browserWrite(data: Library) {
  const db = await database()
  return new Promise<void>((resolve,reject)=>{const tx=db.transaction('workspace','readwrite');tx.objectStore('workspace').put(data,'library');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>{db.close();reject(tx.error)}})
}
export async function loadWorkspace(): Promise<{ data: unknown | null; error?: string }> {
  if (window.desktop) { backend='desktop'; return window.desktop.load() }
  let response:Response|undefined
  try {
    response=await fetch('/api/library',{signal:AbortSignal.timeout(3000)})
  } catch { /* Development preview uses IndexedDB, never small localStorage quotas. */ }
  if(response?.headers.get('content-type')?.includes('application/json')){
    const result=await response.json();if(!response.ok)throw new Error(result.error||'无法读取本地书架。');backend='server';revision=result.revision||0;if(!result.data)result.data=await browserRead();return result
  }
  backend='browser';return {data:await browserRead()}
}
export function saveWorkspace(data: Library): Promise<void> {
  const operation=queue.catch(()=>{}).then(async()=>{
    if(backend==='desktop')return window.desktop!.save(data)
    if(backend==='browser')return browserWrite(data)
    const response=await fetch('/api/library',{method:'PUT',headers:{'Content-Type':'application/json','X-Zhiling-Client':'local'},body:JSON.stringify({revision,data})})
    const result=await response.json()
    if(!response.ok)throw new Error(result.error || '本地服务保存失败。')
    revision=result.revision
  });queue=operation;return operation
}
export function storageDescription(){return backend==='server'?'本地 JSON 书架':backend==='desktop'?'本地 JSON 书架':'本浏览器书架'}
