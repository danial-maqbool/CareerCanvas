import re
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import Field
from .profile_schemas import StrictModel
class RepoInput(StrictModel):url:str=Field(max_length=2000)
router=APIRouter(prefix='/api/import',tags=['Reviewed public metadata import'])
@router.post('/github-preview')
def preview(p:RepoInput):
    match=re.fullmatch(r'https://github\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+)/?',p.url)
    if not match or '..' in match.groups():raise HTTPException(422,'Enter a public https://github.com/owner/repository URL')
    owner,name=match.groups();name=name.removesuffix('.git');base=f'https://api.github.com/repos/{owner}/{name}'
    try:
        headers={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10'}
        response=httpx.get(base,headers=headers,timeout=15,follow_redirects=False)
        if response.status_code!=200:raise HTTPException(422,'Public repository unavailable or GitHub rate limit reached')
        repo=response.json()
        if repo.get('private'):raise HTTPException(422,'Only public repositories can be imported')
        languages=httpx.get(base+'/languages',headers=headers,timeout=15,follow_redirects=False)
        return {'name':repo['name'],'description':repo.get('description') or '', 'languages':list(languages.json()) if languages.status_code==200 else [repo['language']] if repo.get('language') else [],'stars':repo.get('stargazers_count',0),'topics':repo.get('topics',[]),'url':repo['html_url']}
    except httpx.HTTPError as e:raise HTTPException(503,'GitHub could not be reached; try again later') from e
