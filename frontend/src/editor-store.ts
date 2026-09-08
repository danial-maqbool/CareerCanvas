import { create } from 'zustand'
import { api, json } from './api'
import { Resume, savePayload } from './resume-types'

const snapshot = (resume:Resume) => JSON.stringify({name:resume.name,target_role:resume.target_role,archived:resume.archived,document:resume.document})
type EditorState = {
  resume:Resume|null, past:Resume[], future:Resume[], savedSnapshot:string,
  status:'saved'|'pending'|'saving'|'error', error:string, savedAt:number|null,
  open:(resume:Resume)=>void, change:(mutate:(resume:Resume)=>void)=>void,
  undo:()=>void, redo:()=>void,
}

export const useEditor = create<EditorState>((set,get)=>({
  resume:null,past:[],future:[],savedSnapshot:'',status:'saved',error:'',savedAt:null,
  open:resume=>set({resume:structuredClone(resume),past:[],future:[],savedSnapshot:snapshot(resume),status:'saved',error:'',savedAt:Date.now()}),
  change:mutate=>{const state=get();if(!state.resume)return;const next=structuredClone(state.resume);mutate(next);if(snapshot(next)===snapshot(state.resume))return;set({resume:next,past:[...state.past,state.resume].slice(-100),future:[],status:'pending',error:''})},
  undo:()=>{const state=get();if(!state.resume||!state.past.length)return;const previous=structuredClone(state.past.at(-1)!);previous.revision=state.resume.revision;set({resume:previous,past:state.past.slice(0,-1),future:[state.resume,...state.future],status:'pending',error:''})},
  redo:()=>{const state=get();if(!state.resume||!state.future.length)return;const next=structuredClone(state.future[0]);next.revision=state.resume.revision;set({resume:next,past:[...state.past,state.resume],future:state.future.slice(1),status:'pending',error:''})},
}))

let timer:ReturnType<typeof setTimeout>|undefined
let pending:Promise<void>|undefined

export async function flushSave():Promise<void> {
  clearTimeout(timer)
  if(pending){await pending;return flushSave()}
  const state=useEditor.getState(),resume=state.resume
  if(!resume||snapshot(resume)===state.savedSnapshot){if(state.status!=='saved')useEditor.setState({status:'saved'});return}
  const sent=snapshot(resume)
  useEditor.setState({status:'saving'})
  pending=(async()=>{
    try{
      const saved=await api<Resume>(`/resumes/${resume.id}`,json('PUT',savePayload(resume)))
      const current=useEditor.getState().resume
      if(current?.id===saved.id)useEditor.setState({resume:{...current,revision:saved.revision,updated_at:saved.updated_at},savedSnapshot:sent,status:snapshot(current)===sent?'saved':'pending',savedAt:Date.now(),error:''})
    }catch(e){useEditor.setState({status:'error',error:(e as Error).message});throw e}
  })()
  try{await pending}finally{pending=undefined}
  if(useEditor.getState().status==='pending')return flushSave()
}

export function startAutosave(){
  const unsubscribe=useEditor.subscribe((state,previous)=>{
    if(state.resume!==previous.resume&&state.status==='pending'){
      clearTimeout(timer)
      timer=setTimeout(()=>{void flushSave().catch(()=>{})},700)
    }
  })
  return ()=>{unsubscribe();clearTimeout(timer)}
}
