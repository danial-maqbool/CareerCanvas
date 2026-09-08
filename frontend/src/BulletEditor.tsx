import { useState } from 'react'
import { ArrowDown, ArrowUp, BookmarkPlus, Plus, Trash2 } from 'lucide-react'
import { Drawer } from './Profile'
import { SortableList, SortableRow } from './SortableList'
import { useEditor } from './editor-store'
import { api, json } from './api'

export default function BulletEditor({sectionId,itemId,onClose}:{sectionId:string,itemId:string,onClose:()=>void}){
  const resume=useEditor(s=>s.resume)!,change=useEditor(s=>s.change)
  const item=resume.document.sections.find(s=>s.id===sectionId)!.items.find(i=>i.id===itemId)!
  const bullets=(item.data.bullets||[]) as {id:string,text:string}[]
  const [notice,setNotice]=useState('')
  function update(fn:(list:{id:string,text:string}[])=>void){change(r=>{const target=r.document.sections.find(s=>s.id===sectionId)!.items.find(i=>i.id===itemId)!;if(!target.data.bullets)target.data.bullets=[];fn(target.data.bullets as {id:string,text:string}[])})}
  function move(index:number,offset:number){update(list=>{const [b]=list.splice(index,1);list.splice(index+offset,0,b)})}
  return <Drawer title="Make every bullet count." onClose={onClose}><div className="drawer-form"><p className="form-note">Start with an action, explain your contribution, and show a real result. Drag to reorder or use the arrow controls.</p><SortableList ids={bullets.map(b=>b.id)} onReorder={ids=>update(list=>{const reordered=ids.map(id=>list.find(b=>b.id===id)!);list.splice(0,list.length,...reordered)})}>{bullets.map((bullet,index)=><SortableRow key={bullet.id} id={bullet.id} label={`bullet ${index+1}`}><div className="bullet-editor-card"><label className="field"><span>Bullet {index+1}</span><textarea aria-label={`Bullet ${index+1}`} rows={3} value={bullet.text} onChange={e=>update(list=>{list[index].text=e.target.value})}/></label><div className="bullet-actions"><button className="icon-button" disabled={index===0} aria-label={`Move bullet ${index+1} up`} onClick={()=>move(index,-1)}><ArrowUp size={14}/></button><button className="icon-button" disabled={index===bullets.length-1} aria-label={`Move bullet ${index+1} down`} onClick={()=>move(index,1)}><ArrowDown size={14}/></button><button className="icon-button" aria-label={`Save bullet ${index+1} to achievement library`} onClick={async()=>{try{await api('/profile/items',json('POST',{kind:'achievements',data:{statement:bullet.text,company:String(item.data.company||''),project:String(item.data.name||'')}}));setNotice('Achievement saved to your reusable library')}catch(e){setNotice((e as Error).message)}}}><BookmarkPlus size={14}/></button><button className="icon-button" aria-label={`Delete bullet ${index+1}`} onClick={()=>update(list=>{list.splice(index,1)})}><Trash2 size={14}/></button></div></div></SortableRow>)}</SortableList><button className="button secondary" onClick={()=>update(list=>{list.push({id:crypto.randomUUID(),text:'Describe your contribution and result.'})})}><Plus size={14}/>Add bullet</button>{notice&&<p className="notice" role="status">{notice}</p>}<button className="button primary" onClick={onClose}>Done</button></div></Drawer>
}
