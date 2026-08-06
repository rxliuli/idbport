import { useEffect } from 'react'
import { NativeSelect, NativeSelectOption } from './native-select'

export function SelectGroup(props: {
  value?: string
  onChange?: (value?: string) => void
  options: { label: string; value: string }[]
  name?: string
  placeholder?: string
  className?: string
  disabled?: boolean
  required?: boolean
}) {
  const { value, onChange, options } = props

  useEffect(() => {
    if (options.length > 0 && (!value || !options.some((o) => o.value === value))) {
      onChange?.(options[0]!.value)
    }
  }, [options])

  return (
    <NativeSelect
      value={props.value}
      onChange={(ev) => props.onChange?.(ev.target.value)}
    >
      {options.map((it) => (
        <NativeSelectOption value={it.value} key={it.value}>
          {it.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
