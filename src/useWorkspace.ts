import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type RelationshipGraph from './components/RelationshipGraph.vue'
import { createLibrary, parseLibrary, story, themes, type Library, type Theme } from './library'
import { addCharacter, clone, palette, parseAtlas, relationFrom, relationLabel, removeCharacter, splitTags, uid, type Atlas, type Character, type Relation } from './model'
import { createSample } from './sample'
import { loadWorkspace, saveWorkspace, storageDescription } from './storage'
import { parseColorHistory } from './colors'
import { characterGroups, belongsToGroup, sortCharacters, initialRelation, type InitialDirection } from './characters'
import { parseLayoutDensity } from './layoutDensity'

export function useWorkspace() {
  const library=ref<Library>(createLibrary(createSample())),data=ref<Atlas>(clone(library.value.graphs[0]!.data))
  const ready=ref(false),recoveryBlocked=ref(false),saveStatus=ref('正在载入'),storageLabel=ref('本地书架')
  const query=ref(''),group=ref(''),selectedId=ref(''),selectedKind=ref<'character'|'relation'|'none'>('none')
  const labels=ref(true),neighborhood=ref(false),layout=ref('fcose'),inspector=ref(false),zoom=ref(100)
  const graph=ref<InstanceType<typeof RelationshipGraph>>(),modal=ref(''),formError=ref(''),toast=ref(''),toastError=ref(false),jsonInput=ref<HTMLInputElement>()
  const draftCharacter=ref({id:'',name:'',groups:[] as string[],color:palette[0]!,notes:'',tags:'',initialTo:'',initialLabel:'朋友',initialDirection:'two-way' as InitialDirection})
  const draftRelation=ref({id:'',from:'',to:'',label:'',direction:'one-way' as 'one-way'|'two-way',description:''})
  const draftProject=ref({title:''}),creatingProject=ref(false),bookQuery=ref('')
  const isEditing=ref(false),pendingImport=ref<{data:Atlas;warnings:string[];library?:Library}|null>(null)
  const undoStack=ref<Atlas[]>([]),redoStack=ref<Atlas[]>([])
  const confirmation=ref<{title:string;description:string;action:()=>void;destructive:boolean}|null>(null)
  let toastTimer:ReturnType<typeof setTimeout>,saveNumber=0,pendingSaves=0
  const theme=computed(()=>library.value.theme)
  const layoutDensity=computed({get:()=>parseLayoutDensity(library.value.layoutDensity),set:(value:number)=>{library.value.layoutDensity=parseLayoutDensity(value);void persist().catch(()=>{})}})
  const groups=computed(()=>[...new Set(data.value.characters.flatMap(c=>characterGroups(c).length?characterGroups(c):['未分组']))])
  const sortedCharacters=computed(()=>sortCharacters(data.value.characters))
  const characters=computed(()=>data.value.characters.filter(c=>belongsToGroup(c,group.value)&&`${c.name} ${c.id} ${characterGroups(c).join(' ')} ${c.tags?.join(' ')}`.toLowerCase().includes(query.value.toLowerCase())))
  const books=computed(()=>library.value.graphs.filter(s=>s.data.title.toLowerCase().includes(bookQuery.value.toLowerCase())))
  const character=computed(()=>selectedKind.value==='character'?data.value.characters.find(c=>c.id===selectedId.value):undefined)
  const relation=computed(()=>selectedKind.value==='relation'?data.value.relations.find(r=>r.id===selectedId.value):undefined)
  const linked=computed(()=>character.value?data.value.relations.filter(r=>r.from===character.value!.id||r.to===character.value!.id):[])
  const selection=computed(()=>selectedKind.value==='none'?'':`${selectedKind.value==='character'?'c':'r'}:${selectedId.value}`)
  const connectedPeople=computed(()=>new Set(linked.value.flatMap(r=>[r.from,r.to]).filter(id=>id!==character.value?.id)).size)
  const name=(id:string)=>data.value.characters.find(c=>c.id===id)?.name||id
  // Exactly one floating relation window; replacing/closing never restores old state.
  const hoverId=ref(''),floatingId=ref(''),pinnedId=ref(''),floatQuery=ref('')
  let hideTimer:ReturnType<typeof setTimeout>|undefined
  const floatingCharacter=computed(()=>data.value.characters.find(c=>c.id===floatingId.value))
  const floatingRows=computed(()=>{
    if(!floatingCharacter.value)return []
    const id=floatingCharacter.value.id
    return data.value.characters.filter(c=>c.id!==id&&`${c.name} ${characterGroups(c).join(' ')}`.includes(floatQuery.value)).map(c=>({character:c,relations:data.value.relations.filter(r=>(r.from===id&&r.to===c.id)||(r.to===id&&r.from===c.id))})).sort((a,b)=>Number(!!b.relations.length)-Number(!!a.relations.length))
  })
  function enterCharacter(id:string){clearTimeout(hideTimer);hoverId.value=id;if(!pinnedId.value){floatingId.value=id;floatQuery.value=''}}
  function leaveCharacter(){hoverId.value='';clearTimeout(hideTimer);hideTimer=setTimeout(()=>{if(!pinnedId.value)floatingId.value=''},180)}
  function holdFloating(){clearTimeout(hideTimer)}
  function releaseFloating(){if(!pinnedId.value&&!hoverId.value)leaveCharacter()}
  function pinCharacter(id:string){clearTimeout(hideTimer);if(pinnedId.value===id){pinnedId.value='';if(hoverId.value!==id)floatingId.value=''}else{pinnedId.value=id;floatingId.value=id;floatQuery.value=''}}
  function closeFloating(){clearTimeout(hideTimer);floatingId.value='';pinnedId.value='';floatQuery.value=''}
  function notify(message:string,error=false){clearTimeout(toastTimer);toast.value=message;toastError.value=error;if(!error)toastTimer=setTimeout(()=>toast.value='',4200)}
  function errorMessage(e:unknown){return e instanceof Error?e.message.replace(/^Error invoking remote method '[^']+': Error: /,''):String(e)}
  function syncCurrent(){const entry=library.value.graphs.find(s=>s.id===library.value.activeId);if(entry){entry.data=clone(data.value);entry.updatedAt=new Date().toISOString()}}
  async function persist(showToast=false){
    if(!ready.value||recoveryBlocked.value)return
    syncCurrent();const number=++saveNumber;pendingSaves++;saveStatus.value='保存中…'
    try{await saveWorkspace(clone(library.value));if(number===saveNumber)saveStatus.value='已自动保存';if(showToast)notify('整个关系网书架已保存到本机')}
    catch(e){saveStatus.value='保存失败';notify(`保存失败：${errorMessage(e)}`,true);throw e}finally{pendingSaves--}
  }
  function commit(next:Atlas){undoStack.value.push(clone(data.value));if(undoStack.value.length>30)undoStack.value.shift();redoStack.value=[];data.value=next;recoveryBlocked.value=false;cleanSelection();void persist().catch(()=>{})}
  function undo(){const prior=undoStack.value.pop();if(!prior)return;redoStack.value.push(clone(data.value));data.value=prior;cleanSelection();void persist().catch(()=>{})}
  function redo(){const next=redoStack.value.pop();if(!next)return;undoStack.value.push(clone(data.value));data.value=next;cleanSelection();void persist().catch(()=>{})}
  function cleanSelection(){if(selectedKind.value==='character'&&!character.value||selectedKind.value==='relation'&&!relation.value){selectedKind.value='none';selectedId.value=''}if(group.value&&!groups.value.includes(group.value))group.value='';if(floatingId.value&&!floatingCharacter.value)closeFloating()}
  function select(kind:'character'|'relation'|'none',id:string,focus=false){selectedKind.value=kind;selectedId.value=id;if(kind!=='none')inspector.value=true;if(focus)graph.value?.focus(id)}
  function openModal(kind:string){formError.value='';closeFloating();modal.value=kind}
  function editCharacter(c?:Character){isEditing.value=!!c;draftCharacter.value={id:c?.id||uid('character'),name:c?.name||'',groups:c?characterGroups(c):group.value&&group.value!=='未分组'?[group.value]:[],color:c?.color||palette[groups.value.length%palette.length]!,notes:c?.notes||'',tags:c?.tags?.join(' ')||'',initialTo:'',initialLabel:'朋友',initialDirection:'two-way'};openModal('character')}
  function submitCharacter(){try{
    const d=draftCharacter.value,existing=data.value.characters.find(c=>c.id===d.id)
    const c:Character={...existing,id:d.id,name:d.name.trim(),groups:[...d.groups],color:d.color,notes:d.notes,tags:splitTags(d.tags)}
    if(!c.name)throw new Error('请填写角色名称。')
    let next=isEditing.value?{...data.value,characters:data.value.characters.map(old=>old.id===c.id?c:old)}:addCharacter(data.value,c)
    if(!isEditing.value&&d.initialTo){if(!d.initialLabel.trim())throw new Error('请填写完整的初始关系。');next={...next,relations:[...next.relations,{id:uid('relation'),...initialRelation(c.id,d.initialTo,d.initialDirection),label:d.initialLabel.trim()}]}}
    commit(parseAtlas(next).data);group.value='';select('character',c.id);modal.value='';notify(isEditing.value?'角色档案已更新':`已添加角色「${c.name}」`)
  }catch(e){formError.value=errorMessage(e)}}
  function editRelation(r?:Relation){isEditing.value=!!r;draftRelation.value={id:r?.id||uid('relation'),from:r?.from||character.value?.id||data.value.characters[0]?.id||'',to:r?.to||data.value.characters.find(c=>c.id!==(character.value?.id||data.value.characters[0]?.id))?.id||data.value.characters[0]?.id||'',label:r?relationLabel(r):'',direction:r?.direction||'one-way',description:r?.description||''};openModal('relation')}
  function submitRelation(){try{const d=draftRelation.value;if(!d.from||!d.to||!d.label.trim())throw new Error('请选择两端角色并填写关系名称。');const r={...data.value.relations.find(r=>r.id===d.id),...d,label:d.label.trim()};commit(parseAtlas({...data.value,relations:isEditing.value?data.value.relations.map(old=>old.id===r.id?r:old):[...data.value.relations,r]}).data);select('relation',r.id);modal.value='';notify('关系已保存')}catch(e){formError.value=errorMessage(e)}}
  function askConfirmation(title:string,description:string,action:()=>void,destructive=false){confirmation.value={title,description,action,destructive};openModal('confirm')}
  function deleteCharacter(c:Character){askConfirmation(`删除「${c.name}」？`,`同时移除与该角色有关的 ${linked.value.length} 条关系。此操作可以撤销。`,()=>{commit(removeCharacter(data.value,c.id));select('none','');modal.value='';notify('角色已删除，可撤销恢复')},true)}
  function deleteRelation(r:Relation){askConfirmation('删除这条关系？',`${name(r.from)} ↔ ${name(r.to)} · ${relationLabel(r)}。此操作可以撤销。`,()=>{commit({...data.value,relations:data.value.relations.filter(old=>old.id!==r.id)});select('none','');modal.value=''},true)}
  function activate(id:string){syncCurrent();const entry=library.value.graphs.find(s=>s.id===id);if(!entry)return;library.value.activeId=id;data.value=clone(entry.data);query.value='';group.value='';undoStack.value=[];redoStack.value=[];closeFloating();select('none','');inspector.value=false;modal.value='';void persist().catch(()=>{})}
  function addStory(atlas:Atlas){if(library.value.graphs.length>=1000)throw new Error('书架最多保存 1,000 张关系网。');syncCurrent();const entry=story(atlas);library.value.graphs.push(entry);activate(entry.id)}
  function newProject(){creatingProject.value=true;draftProject.value={title:''};openModal('project')}
  function editProject(){creatingProject.value=false;draftProject.value={title:data.value.title};openModal('project')}
  function submitProject(){try{if(!draftProject.value.title.trim())throw new Error('请填写关系网名称。');const values={title:draftProject.value.title.trim()};if(creatingProject.value)addStory({version:1,...values,characters:[],relations:[]});else commit({...data.value,...values});modal.value='';notify(creatingProject.value?'新关系网已加入书架':'关系网信息已保存')}catch(e){formError.value=errorMessage(e)}}
  function deleteStory(id:string){const entry=library.value.graphs.find(s=>s.id===id);if(!entry)return;askConfirmation(`删除关系网「${entry.data.title}」？`,'这将从本机书架移除整张关系网，建议先导出 JSON 备份。',()=>{library.value.graphs=library.value.graphs.filter(s=>s.id!==id);if(!library.value.graphs.length)library.value.graphs.push(story({version:1,title:'新的故事',characters:[],relations:[]}));if(library.value.activeId===id)activate(library.value.graphs[0]!.id);else{modal.value='library';void persist().catch(()=>{})}},true)}
  function changeTheme(value:Theme){library.value.theme=value;void persist().catch(()=>{})}
  watch(theme,value=>{document.documentElement.dataset.theme=value},{immediate:true})
  async function importJson(){if(!window.desktop){jsonInput.value?.click();return}try{const result=await window.desktop.importJson();if(result)previewImport(result.data)}catch(e){notify(`导入失败：${errorMessage(e)}`,true)}}
  function previewImport(input:unknown){if((input as {version?:number})?.version===2){const imported=parseLibrary(input);pendingImport.value={data:imported.graphs[0]!.data,warnings:[],library:imported}}else{const parsed=parseAtlas(input);pendingImport.value=parsed}openModal('import')}
  async function readJson(event:Event){const input=event.target as HTMLInputElement,file=input.files?.[0];input.value='';if(!file)return;try{if(file.size>128*1024*1024)throw new Error('文件不能超过 128 MB。');previewImport(JSON.parse((await file.text()).replace(/^\uFEFF/,'')))}catch(e){notify(`导入失败：${errorMessage(e)}`,true)}}
  function confirmImport(){try{const pending=pendingImport.value;if(!pending)return;if(pending.library){if(library.value.graphs.length+pending.library.graphs.length>1000)throw new Error('导入后超过 1,000 张关系网。');syncCurrent();const entries=pending.library.graphs.map(s=>story(s.data));library.value.graphs.push(...entries);library.value.customColors=parseColorHistory([...(library.value.customColors||[]),...(pending.library.customColors||[])]);activate(entries[0]!.id)}else addStory(pending.data);pendingImport.value=null;modal.value='';notify('已作为新关系网加入书架，原有关系网保留')}catch(e){formError.value=errorMessage(e)}}
  function downloadBlob(blob:Blob,filename:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
  async function exportJson(all=false){try{syncCurrent();const payload=all?clone(library.value):clone(data.value);if(window.desktop){if(await window.desktop.exportJson(payload))notify('JSON 已导出')}else{downloadBlob(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}),`${all?'织灵-完整书架':data.value.title.replace(/[<>:"/\\|?*]/g,'_')}.json`);notify('JSON 已导出')}}catch(e){notify(`导出失败：${errorMessage(e)}`,true)}}
  const exporting=ref(false)
  async function exportImage(){if(exporting.value)return;exporting.value=true;try{const blob=await graph.value?.exportImage();if(!blob)throw new Error('关系网尚未就绪。');if(window.desktop?.exportImage){if(await window.desktop.exportImage(await blob.arrayBuffer(),data.value.title))notify('整张关系网已导出为 PNG')}else{downloadBlob(blob,`${data.value.title.replace(/[<>:"/\\|?*]/g,'_')}-完整关系网.png`);notify('完整关系网 PNG 已导出（包含筛选外的角色）')}}catch(e){notify(`图片导出失败：${errorMessage(e)}`,true)}finally{exporting.value=false}}
  function keydown(e:KeyboardEvent){if(e.key==='Escape'){modal.value='';return}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();void persist(true).catch(()=>{});return}const editing=(e.target as HTMLElement)?.matches('input,textarea,select,[contenteditable]');if(!editing&&!modal.value&&(e.ctrlKey||e.metaKey)){if(e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}if(e.key.toLowerCase()==='y'){e.preventDefault();redo()}}}
  function beforeUnload(e:BeforeUnloadEvent){if(pendingSaves||saveStatus.value==='保存失败'){e.preventDefault();e.returnValue=''}}
  watch(modal,value=>{if(value)setTimeout(()=>(document.querySelector<HTMLElement>('.modal input:not([type=file])')||document.querySelector<HTMLElement>('.modal button'))?.focus(),50)})
  function trapFocus(e:KeyboardEvent){if(e.key!=='Tab')return;const elements=[...(e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button:not(:disabled),input:not([type=file]),textarea,select,[tabindex="0"]')].filter(el=>el.offsetParent!==null),first=elements[0],last=elements.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}
  onMounted(async()=>{
    document.addEventListener('keydown',keydown);window.addEventListener('beforeunload',beforeUnload)
    try{
      const result=await loadWorkspace();storageLabel.value=storageDescription()
      if(result.data)library.value=parseLibrary(result.data)
      // Migration remains in the user's own app; the original v1 browser value is not removed.
      const legacy=localStorage.getItem('novel-atlas-v1')
      if(legacy&&!localStorage.getItem('zhiling-v1-migrated')){
        const previous=parseAtlas(JSON.parse(legacy)).data
        if(!result.data)library.value=createLibrary(previous)
        else if(!library.value.graphs.some(s=>JSON.stringify(s.data)===JSON.stringify(previous)))library.value.graphs.push(story(previous))
      }
      data.value=clone(library.value.graphs.find(s=>s.id===library.value.activeId)!.data)
      if(result.error)notify(result.error,true)
      window.desktop?.onClosing(async()=>{try{await persist();await window.desktop!.close()}catch{}})
      ready.value=true;await persist();if(legacy)localStorage.setItem('zhiling-v1-migrated','true')
    }catch(e){ready.value=true;recoveryBlocked.value=true;saveStatus.value='需要恢复数据';notify(`本地书架未覆盖：${errorMessage(e)}`,true)}
  })
  onBeforeUnmount(()=>{document.removeEventListener('keydown',keydown);window.removeEventListener('beforeunload',beforeUnload);clearTimeout(toastTimer);clearTimeout(hideTimer)})
  return {layoutDensity,sortedCharacters,characterGroups,library,data,ready,recoveryBlocked,saveStatus,storageLabel,query,group,selectedId,selectedKind,labels,neighborhood,layout,inspector,zoom,graph,modal,formError,toast,toastError,jsonInput,draftCharacter,draftRelation,draftProject,creatingProject,bookQuery,books,isEditing,pendingImport,undoStack,redoStack,confirmation,theme,themes,groups,characters,character,relation,linked,selection,connectedPeople,name,relationLabel,relationFrom,hoverId,floatingId,pinnedId,floatQuery,floatingCharacter,floatingRows,enterCharacter,leaveCharacter,holdFloating,releaseFloating,pinCharacter,closeFloating,persist,undo,redo,select,openModal,editCharacter,submitCharacter,editRelation,submitRelation,deleteCharacter,deleteRelation,activate,newProject,editProject,submitProject,deleteStory,changeTheme,importJson,readJson,confirmImport,exportJson,exportImage,exporting,trapFocus,palette}
}
