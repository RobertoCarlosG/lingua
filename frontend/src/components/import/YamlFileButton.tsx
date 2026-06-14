import { useRef } from 'react'
import { cn } from '@/lib/utils'

interface YamlFileButtonProps {
  label: string
  onLoad: (text: string, filename: string) => void | Promise<void>
  icon?: React.ReactNode
  className?: string
  labelClassName?: string
  disabled?: boolean
}

export function YamlFileButton({ label, onLoad, icon, className, labelClassName, disabled }: YamlFileButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await onLoad(await file.text(), file.name)
    e.target.value = ''
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".yml,.yaml,text/yaml"
        className="hidden"
        onChange={handleChange}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className={cn('btn btn-ghost shrink-0', className)}
      >
        {icon}
        <span className={labelClassName}>{label}</span>
      </button>
    </>
  )
}
