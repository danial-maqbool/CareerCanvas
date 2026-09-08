import { renderToStaticMarkup } from 'react-dom/server'
import ResumePaper from './ResumePaper'
import { ResumeDocument, ResumeItem, ResumeSection } from './resume-types'

export type PageLayout={document:ResumeDocument,first:boolean}
export type Pagination={pages:PageLayout[],warnings:string[]}

/** Measure real template DOM. User strings enter only through React's escaping renderer. */
export function paginateDocument(document:ResumeDocument):Pagination{
  const pageHeight=(document.style.page_size==='A4'?297:279.4)*96/25.4
  const sandbox=window.document.createElement('div')
  sandbox.className='pagination-measure'
  sandbox.style.cssText='position:fixed;left:-30000px;top:0;visibility:hidden;pointer-events:none;'
  window.document.body.appendChild(sandbox)
  const warnings:string[]=[],pages:PageLayout[]=[]
  let current:PageLayout={document:{...document,sections:[]},first:true}
  const hasContent=()=>current.first||current.document.sections.some(s=>s.items.length)
  function fits(page:PageLayout){
    sandbox.innerHTML=renderToStaticMarkup(<ResumePaper document={page.document} showHeader={page.first} showSummary={page.first}/>)
    const paper=sandbox.firstElementChild as HTMLElement
    paper.style.minHeight='0'
    const height=paper.getBoundingClientRect().height
    return height<=pageHeight-2
  }
  function nextPage(){if(hasContent())pages.push(current);current={document:{...document,sections:[]},first:false}}
  function add(section:ResumeSection,item:ResumeItem,depth=0){
    let existing=current.document.sections.find(s=>s.id===section.id)
    if(!existing){existing={...section,items:[]};current.document.sections.push(existing)}
    existing.items.push(item)
    if(fits(current))return
    existing.items.pop()
    if(!existing.items.length)current.document.sections=current.document.sections.filter(s=>s!==existing)
    if(hasContent()){nextPage();add(section,item,depth);return}
    const bullets=item.data.bullets as {id:string,text:string}[]|undefined
    if(depth<12&&bullets&&bullets.length>1){
      const split=Math.ceil(bullets.length/2)
      add(section,{...item,id:`${item.id}-a`,data:{...item.data,bullets:bullets.slice(0,split)}},depth+1)
      add(section,{...item,id:`${item.id}-b`,data:{...item.data,description:'',bullets:bullets.slice(split)}},depth+1)
      return
    }
    if(depth<12&&typeof item.data.description==='string'&&item.data.description.length>600){
      const words=item.data.description.split(' '),split=Math.ceil(words.length/2)
      add(section,{...item,id:`${item.id}-a`,data:{...item.data,description:words.slice(0,split).join(' '),bullets:[]}},depth+1)
      add(section,{...item,id:`${item.id}-b`,data:{...item.data,description:words.slice(split).join(' ')}},depth+1)
      return
    }
    current.document.sections.push({...section,items:[item]})
    warnings.push(`${section.heading}: an item is taller than the usable page. Shorten it, reduce spacing, or split the content.`)
    nextPage()
  }
  try{
    if(!fits(current))warnings.push('The header or summary exceeds one page. Shorten the summary or reduce spacing.')
    for(const section of document.sections.filter(s=>s.visible)){
      if(!section.items.length){const candidate={...section,items:[]};current.document.sections.push(candidate);if(!fits(current)&&hasContent()){current.document.sections.pop();nextPage();current.document.sections.push(candidate)}}
      for(const item of section.items)add(section,item)
    }
    if(hasContent())pages.push(current)
    return {pages:pages.length?pages:[{document,first:true}],warnings:[...new Set(warnings)]}
  }finally{sandbox.remove()}
}
