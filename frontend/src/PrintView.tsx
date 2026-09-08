import { useEffect, useState } from 'react'
import { api } from './api'
import { Resume } from './resume-types'
import PaginatedPaper from './PaginatedPaper'

export default function PrintView({ id }: { id: string }) {
  const [resume, setResume] = useState<Resume | null>(null),
    [error, setError] = useState('')
  useEffect(() => {
    api<Resume>(`/resumes/${encodeURIComponent(id)}`)
      .then(setResume)
      .catch((e) => setError(e.message))
  }, [id])
  if (!resume) return <p role="status">{error || 'Preparing document…'}</p>
  return (
    <main className="print-document">
      <style>{`@page {size:${resume.document.style.page_size === 'Letter' ? 'Letter' : 'A4'};margin:0;} .print-document .paper-page {margin:0;box-shadow:none;} .print-document .page-number {display:none;}`}</style>
      <PaginatedPaper document={resume.document} />
    </main>
  )
}
