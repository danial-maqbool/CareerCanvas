import { useEffect, useState } from 'react'
import { api, json } from './api'

type Feedback={score:number,checks:{name:string,passed:boolean,suggestion:string}[]}
export default function BulletFeedback({text}:{text:string}){
  const [feedback,setFeedback]=useState<Feedback|null>(null)
  useEffect(()=>{let active=true;const timer=setTimeout(()=>api<Feedback>('/analysis/bullet',json('POST',{text})).then(f=>{if(active)setFeedback(f)}).catch(()=>{}),400);return()=>{active=false;clearTimeout(timer)}},[text])
  return feedback?<div className="bullet-feedback"><div>{feedback.checks.map(check=><span key={check.name} className={check.passed?'passed':''} title={check.suggestion}>{check.passed?'✓':'○'} {check.name}</span>)}</div>{feedback.checks.find(c=>!c.passed)&&<p>{feedback.checks.find(c=>!c.passed)!.suggestion}</p>}</div>:null
}
