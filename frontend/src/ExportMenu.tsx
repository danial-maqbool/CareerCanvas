import { useState } from 'react'
import { Download } from 'lucide-react'
import { flushSave, useEditor } from './editor-store'

export default function ExportMenu(){
  const resume=useEditor(s=>s.resume)!,[busy,setBusy]=useState(false),[error,setError]=useState('')
  async function download(format:string){
    setBusy(true);setError('')
    try{
      await flushSave()
      const response=await fetch(`/api/resumes/${resume.id}/export/${format}`,{method:format==='json'?'GET':'POST'})
      if(!response.ok){const body=await response.json();throw new Error(body.detail||'Export failed')}
      const blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a')
      link.href=url;link.download=`${resume.name}.${format}`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  }
  return <div className="export-control"><details className="action-menu"><summary className="button primary" aria-label="Export resume"><Download size={14}/>{busy?'Exporting…':'Export'}</summary><div><button disabled={busy} onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');void download('pdf')}}>Download PDF</button><button disabled={busy} onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');void download('json')}}>Download JSON</button></div></details>{error&&<div className="export-error" role="alert">{error}</div>}</div>
}
