import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'

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
  const {
    value,
    onChange,
    options,
    name,
    placeholder,
    className,
    disabled,
    required,
  } = props

  return (
    <Select
      name={name}
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger className={className}>
        <span className="truncate">
          {options.find((it) => it.value === value)?.label ??
            placeholder ??
            'Please select'}
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// export function SelectGroup(props: {
//   value?: string
//   onChange?: (value?: string) => void
//   options: { label: string; value: string }[]
//   name?: string
//   placeholder?: string
//   className?: string
//   disabled?: boolean
//   required?: boolean
// }) {
//   return (
//     <select
//       value={props.value}
//       onChange={(ev) => props.onChange?.(ev.target.value)}
//     >
//       {props.options.map((option) => (
//         <option
//           key={option.value}
//           value={option.value}
//           selected={option.value === props.value}
//         >
//           {option.label}
//         </option>
//       ))}
//     </select>
//   )
// }
