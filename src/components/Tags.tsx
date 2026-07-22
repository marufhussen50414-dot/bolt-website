type TagsProps = {
  tags: string[]
  className?: string
  size?: 'sm' | 'md'
}

/**
 * Displays seller-entered tags as pill-shaped/rounded boxes.
 * Renders nothing when there are no tags — never shows fake/sample tags.
 */
export default function Tags({ tags, className = '', size = 'sm' }: TagsProps) {
  if (!tags || tags.length === 0) return null

  const sizing =
    size === 'md'
      ? 'px-3 py-1 text-xs'
      : 'px-2.5 py-0.5 text-[11px]'

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((tag) => (
        <span
          key={tag}
          className={`inline-flex animate-tag-pop items-center rounded-full bg-primary-50 font-medium text-primary-700 ring-1 ring-inset ring-primary-200 ${sizing}`}
        >
          {tag}
        </span>
      ))}
    </div>
  )
}
