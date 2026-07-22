import { useRef, useState, KeyboardEvent } from 'react'
import { X, Plus } from 'lucide-react'

type TagInputProps = {
  tags: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
  maxLength?: number
  label?: string
  hint?: string
}

export default function TagInput({
  tags,
  onChange,
  maxTags = 8,
  maxLength = 20,
  label = 'Tags',
  hint = 'Press Enter or comma to add. These are shown on your listing.',
}: TagInputProps) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = (raw: string) => {
    const value = raw.trim().replace(/,/g, '')
    if (!value) return
    if (value.length > maxLength) return
    if (tags.includes(value)) {
      setDraft('')
      return
    }
    if (tags.length >= maxTags) return
    onChange([...tags, value])
    setDraft('')
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && draft === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const handleAddClick = () => {
    addTag(draft)
    inputRef.current?.focus()
  }

  const canAddMore = tags.length < maxTags

  return (
    <div>
      {label && <span className="label">{label}</span>}
      <div
        className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-200 bg-white px-2.5 py-2.5 transition-colors focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex animate-tag-pop items-center gap-1 rounded-full bg-primary-50 py-1 pl-3 pr-1.5 text-xs font-medium text-primary-700 ring-1 ring-inset ring-primary-200"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-primary-500 transition-colors hover:bg-primary-100 hover:text-primary-800"
              aria-label={`Remove tag ${tag}`}
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        {canAddMore ? (
          <div className="flex flex-1 items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => addTag(draft)}
              placeholder={tags.length === 0 ? 'Type a tag and press Enter' : 'Add another'}
              className="min-w-[120px] flex-1 border-0 bg-transparent py-1 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0"
            />
            {draft.trim() && (
              <button
                type="button"
                onClick={handleAddClick}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
                aria-label="Add tag"
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        ) : (
          <span className="py-1 text-xs text-ink-400">Max {maxTags} tags reached</span>
        )}
      </div>
      {hint && (
        <p className="mt-1.5 text-xs text-ink-400">
          {hint}{' '}
          <span className="text-ink-300">
            {tags.length}/{maxTags}
          </span>
        </p>
      )}
    </div>
  )
}
