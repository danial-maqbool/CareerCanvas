import { Profile } from './profile-types'
import { ResumeDocument } from './resume-types'

export const templateInfo=[
  {name:'Classic',description:'Timeless typography. A centered introduction and traditional rules.',tags:['ATS Friendly','Single Column','Corporate','Multi Page']},
  {name:'Modern',description:'A clear hierarchy with a confident nameplate and understated dividers.',tags:['ATS Friendly','Single Column','Corporate']},
  {name:'Minimal',description:'Quiet typography and generous white space. Nothing gets in the way.',tags:['ATS Friendly','Single Column','Minimal','One Page']},
  {name:'Professional',description:'A structured contact band and strong, full-width section labels.',tags:['ATS Friendly','Single Column','Corporate']},
  {name:'Technical',description:'A technical timeline with compact metadata and precise headings.',tags:['ATS Friendly','Single Column','Technical']},
  {name:'Executive',description:'Editorial side labels and a restrained, distinguished masthead.',tags:['Two Column','Corporate','Multi Page']},
  {name:'Compact',description:'A dense but readable document for an experience-rich single page.',tags:['ATS Friendly','Single Column','One Page']},
  {name:'Academic',description:'Numbered sections, scholarly type, and clear publication hierarchy.',tags:['ATS Friendly','Single Column','Academic','Multi Page']},
  {name:'Creative',description:'An expressive nameplate and an asymmetrical two-column body.',tags:['Two Column','Creative']},
  {name:'Two Column',description:'A balanced two-column layout with a dedicated skills rail.',tags:['Two Column','Corporate','Multi Page']},
  {name:'Developer',description:'Monospaced labels, code-inspired structure, and scannable skills.',tags:['ATS Friendly','Single Column','Technical']},
  {name:'Research',description:'A publication-led aesthetic with serif titles and citation-friendly detail.',tags:['ATS Friendly','Single Column','Academic','Multi Page']},
]
export const defaultStyle:ResumeDocument['style']={font:'Arial',font_size:10.5,line_height:1.4,margin:16,section_spacing:14,bullet_spacing:4,accent:'#245c4b',secondary:'#6b7e74',text:'#263832',page_size:'A4',alignment:'left',heading_style:'uppercase',date_style:'short'}
export function profileDocument(profile:Profile):ResumeDocument{
  return {personal:profile.personal,template:'Modern',style:defaultStyle,sections:['experience','education','projects','skills','certifications','publications','achievements','languages'].map(kind=>({id:kind,kind,heading:kind[0].toUpperCase()+kind.slice(1),visible:true,columns:1,separator:' · ',items:profile.items.filter(i=>i.kind===kind).map(i=>({id:i.id,source_id:i.id,kind,data:i.data}))}))}
}
