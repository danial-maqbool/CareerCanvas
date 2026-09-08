import { ItemData, Personal } from './profile-types'

export type ResumeItem = {id:string, source_id:string|null, kind:string, data:ItemData}
export type ResumeSection = {id:string, kind:string, heading:string, visible:boolean, columns:number, separator:string, items:ResumeItem[]}
export type ResumeStyle = {font:string, font_size:number, line_height:number, margin:number, section_spacing:number, bullet_spacing:number, accent:string, secondary:string, text:string, page_size:'A4'|'Letter', alignment:'left'|'center', heading_style:string, date_style:string}
export type ResumeDocument = { personal:Personal, sections:ResumeSection[], template:string, style:ResumeStyle }
export type Resume = {id:string, name:string, purpose:string, target_role:string, document:ResumeDocument, archived:boolean, primary:boolean, revision:number, updated_at:string, created_at:string,ats_score?:number|null,page_count?:number|null}
export const savePayload = (resume:Resume) => ({name:resume.name, target_role:resume.target_role, archived:resume.archived, revision:resume.revision, document:resume.document})
export const templates = ['Classic','Modern','Minimal','Professional','Technical','Executive','Compact','Academic','Creative','Two Column','Developer','Research']
