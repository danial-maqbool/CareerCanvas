import {test,expect} from '@playwright/test'

test('fixing a missing email increases the transparent ATS score by 15',async({page,request})=>{
  const p=await (await request.get('/api/profile')).json()
  const r=await (await request.post('/api/resumes',{data:{name:`ATS ${Date.now()}`,selected_ids:p.items.map((i:{id:string})=>i.id)}})).json()
  r.document.personal.email=''
  await request.put(`/api/resumes/${r.id}`,{data:{name:r.name,revision:r.revision,target_role:'',archived:false,document:r.document}})
  await page.goto('/');await page.getByRole('button',{name:'Resumes',exact:true}).click();await page.getByRole('button',{name:`Open ${r.name}`,exact:true}).click()
  await page.getByRole('button',{name:'ATS Check',exact:true}).click();await page.getByRole('button',{name:'Run ATS analysis',exact:true}).click()
  await expect(page.locator('.score-ring strong')).not.toHaveText('—')
  const before=Number(await page.locator('.score-ring strong').innerText())
  await expect(page.locator('.ats-check').filter({hasText:'Contact email present'})).toContainText('HIGH')
  await page.getByRole('button',{name:'Close drawer',exact:true}).click()
  await page.getByRole('textbox',{name:/^email/i}).fill('alex.morgan@example.com')
  await page.getByRole('button',{name:'ATS Check',exact:true}).click();await page.getByRole('button',{name:'Run ATS analysis',exact:true}).click()
  await expect(page.locator('.score-ring strong')).toHaveText(String(before+15))
  await expect(page.locator('.ats-disclaimer')).toContainText('not a score from an employer')
  await page.screenshot({path:'test-results/ats-analysis.png',fullPage:true})
})
