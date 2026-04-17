'use client'

/**
 * Consistent form field component.
 * @param {string} label - Field label text
 * @param {string} type - Input type (text | email | password | textarea | file)
 * @param {string} value - Controlled value
 * @param {function} onChange - Change handler
 * @param {string} placeholder - Placeholder text
 * @param {boolean} required - Required field
 * @param {number} rows - Textarea rows (default: 2)
 */
export default function FormField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  rows = 2,
  accept,
}) {
  const baseInput = `w-full px-4 py-3 bg-surface-alt rounded-xl border border-border text-sm font-medium text-text transition-all duration-200`

  return (
    <div>
      {label && (
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 block">
          {label}
        </label>
      )}

      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={rows}
          className={`${baseInput} resize-none`}
        />
      ) : type === 'file' ? (
        <input
          type="file"
          accept={accept}
          onChange={onChange}
          className={`${baseInput} text-text-secondary text-xs cursor-pointer file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-primary-light file:text-primary file:font-bold file:text-xs file:cursor-pointer`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={baseInput}
        />
      )}
    </div>
  )
}
