import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushSave, useEditor } from './editor-store'
import { Resume } from './resume-types'

const resume = {
  id: 'resume-1',
  name: 'Original',
  revision: 1,
  target_role: 'Engineer',
  archived: false,
  primary: false,
  purpose: 'General',
  updated_at: '2026-09-08',
  created_at: '2026-09-08',
  document: {
    personal: { full_name: 'Test' },
    sections: [],
    template: 'Modern',
    style: {},
  },
} as unknown as Resume

beforeEach(() => {
  useEditor.getState().open(resume)
  vi.restoreAllMocks()
})
describe('independent editor state', () => {
  it('undoes and redoes content without changing the source object', () => {
    useEditor.getState().change((r) => {
      r.document.personal.full_name = 'Edited'
    })
    expect(resume.document.personal.full_name).toBe('Test')
    useEditor.getState().undo()
    expect(useEditor.getState().resume?.document.personal.full_name).toBe('Test')
    useEditor.getState().redo()
    expect(useEditor.getState().resume?.document.personal.full_name).toBe('Edited')
  })
  it('retains unsaved edits when the server rejects a conflicting revision', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ detail: 'Conflict' }),
      })
    )
    useEditor.getState().change((r) => {
      r.name = 'Local edit'
    })
    await expect(flushSave()).rejects.toThrow('Conflict')
    expect(useEditor.getState().resume?.name).toBe('Local edit')
    expect(useEditor.getState().status).toBe('error')
  })
  it('saves once and advances revision while undo keeps the current revision', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...resume, name: 'New name', revision: 2 }),
    })
    vi.stubGlobal('fetch', fetcher)
    useEditor.getState().change((r) => {
      r.name = 'New name'
    })
    await flushSave()
    await flushSave()
    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(useEditor.getState().status).toBe('saved')
    useEditor.getState().undo()
    expect(useEditor.getState().resume?.revision).toBe(2)
  })
})
