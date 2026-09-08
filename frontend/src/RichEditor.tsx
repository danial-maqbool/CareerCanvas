import { useEffect } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { RichNode } from './resume-types'

export default function RichEditor({
  value,
  text,
  onChange,
}: {
  value?: RichNode | null
  text: string
  onChange: (node: RichNode, text: string) => void
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        strike: false,
        link: false,
        underline: false,
        orderedList: false,
      }),
    ],
    content: value || {
      type: 'doc',
      content: [{ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] }],
    },
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': 'Professional summary',
        'aria-multiline': 'true',
        class: 'rich-input',
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichNode, editor.getText()),
  })
  useEffect(() => {
    if (editor && editor.getText() !== text)
      editor.commands.setContent(
        value || {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: text ? [{ type: 'text', text }] : [],
            },
          ],
        },
        { emitUpdate: false }
      )
  }, [value, text, editor])
  return (
    <div className="rich-editor">
      <div className="rich-toolbar">
        <button
          type="button"
          aria-label="Bold"
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <b>B</b>
        </button>
        <button
          type="button"
          aria-label="Italic"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <i>I</i>
        </button>
        <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()}>
          Bullets
        </button>
        <button
          type="button"
          aria-label="Undo summary edit"
          onClick={() => editor?.chain().focus().undo().run()}
        >
          Undo
        </button>
        <button
          type="button"
          aria-label="Redo summary edit"
          onClick={() => editor?.chain().focus().redo().run()}
        >
          Redo
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
