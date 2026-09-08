import { ComponentProps, useEffect, useState } from 'react'
import ResumePaper from './ResumePaper'
import { paginateDocument, Pagination } from './pagination'

export default function PaginatedPaper(
  props: ComponentProps<typeof ResumePaper> & {
    onLayout?: (layout: Pagination) => void
  }
) {
  const [layout, setLayout] = useState<Pagination>({
    pages: [{ document: props.document, first: true }],
    warnings: [],
  })
  const [ready, setReady] = useState(false)
  useEffect(() => {
    setReady(false)
    const timer = setTimeout(() => {
      const next = paginateDocument(props.document)
      setLayout(next)
      setReady(true)
      props.onLayout?.(next)
    }, 100)
    return () => clearTimeout(timer)
  }, [props.document])
  return (
    <div
      className="paginated-document"
      data-pagination-ready={ready ? 'true' : 'false'}
      data-page-count={layout.pages.length}
    >
      {layout.pages.map((page, index) => (
        <div className="paper-page" key={index}>
          <span className="page-number">
            Page {index + 1} <span>of {layout.pages.length}</span>
          </span>
          <ResumePaper
            {...props}
            document={
              ready ? page.document : { ...page.document, personal: props.document.personal }
            }
            showHeader={page.first}
            showSummary={page.first}
          />
        </div>
      ))}
    </div>
  )
}
