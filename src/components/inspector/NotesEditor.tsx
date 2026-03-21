// ============================================================
// MYTHWRIGHT — NOTES EDITOR (TipTap)
// Supports narrative #tag highlighting via decoration plugin.
// ============================================================
import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { Bold, Italic, Heading2, List, ListOrdered, Quote } from 'lucide-react'
import { clsx } from 'clsx'
import { type TipTapJSON, type NarrativeAnchor } from '../../types'
import { NarrativeTagExtension } from '../../lib/tiptap/NarrativeTagPlugin'

interface NotesEditorProps {
  content: TipTapJSON | null
  onChange: (json: TipTapJSON) => void
  placeholder?: string
  maxChars?: number
  /** Called when user clicks a #dramatic / #logline / #theme chip */
  onTagClick?: (anchor: NarrativeAnchor) => void
}

const ToolBtn = ({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode
}) => (
  <button onClick={onClick} title={title}
    className={clsx(
      'p-1.5 rounded transition-colors duration-[var(--dur-fast)]',
      active
        ? 'bg-[var(--accent-teal-20)] text-[var(--accent-teal)]'
        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-teal-10)]'
    )}>{children}</button>
)

export function NotesEditor({
  content, onChange,
  placeholder = 'Write your notes… use #dramatic, #logline, or #theme to link back to your story anchors.',
  maxChars,
  onTagClick,
}: NotesEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      ...(maxChars ? [CharacterCount.configure({ limit: maxChars })] : []),
      NarrativeTagExtension(onTagClick),
    ],
    content: (content ?? {}) as never,
    immediatelyRender: false,
    onUpdate: ({ editor }) => { onChange(editor.getJSON() as TipTapJSON) },
    editorProps: {
      attributes: { class: 'tiptap-editor', spellcheck: 'true' },
    },
  })

  // Sync when content changes externally (different beat selected, etc.)
  useEffect(() => {
    if (!editor) return
    const cur  = JSON.stringify(editor.getJSON())
    const next = JSON.stringify(content ?? {})
    if (cur !== next) editor.commands.setContent((content ?? {}) as never)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(content)])

  if (!editor) return null

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-[var(--border-subtle)] flex-shrink-0">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')} title="Bold"><Bold size={14}/></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')} title="Italic"><Italic size={14}/></ToolBtn>
        <div className="w-px h-4 bg-[var(--border)] mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })} title="Heading"><Heading2 size={14}/></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')} title="Bullet list"><List size={14}/></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')} title="Ordered list"><ListOrdered size={14}/></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')} title="Blockquote"><Quote size={14}/></ToolBtn>
        {maxChars && (
          <span className="ml-auto text-[10px] text-[var(--text-muted)] pr-1">
            {editor.storage.characterCount?.characters()}/{maxChars}
          </span>
        )}
      </div>
      {/* Editor body */}
      <div className="flex-1 overflow-y-auto px-3 py-2 text-[13px] text-[var(--text-primary)]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
