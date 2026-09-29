export function TextField({
  label,
  name,
  type = 'text',
  error,
  defaultValue,
  autoComplete,
}: {
  label: string
  name: string
  type?: string
  error?: string
  defaultValue?: string
  autoComplete?: string
}) {
  const errorId = `${name}-error`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-label-md text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`h-[52px] rounded-card border-[1.5px] bg-card px-4 text-base text-ink outline-none transition focus:border-brand focus:ring-[3px] focus:ring-brand/15 ${
          error ? 'border-danger' : 'border-border-soft'
        }`}
      />
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
