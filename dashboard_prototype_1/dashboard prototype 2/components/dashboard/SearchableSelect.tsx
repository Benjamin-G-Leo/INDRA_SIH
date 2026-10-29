'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Combobox } from '@base-ui/react/combobox'

export default function SearchableSelect({
  label,
  value,
  options,
  placeholder,
  inputHint,
  formatLabel,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  placeholder: string
  inputHint?: string
  formatLabel?: (val: string) => string
  onChange: (value: string) => void
}) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const display = (val: string): string => {
    if (val === 'all') return placeholder
    return formatLabel ? formatLabel(val) : val
  }

  const q = inputValue.trim().toLowerCase()
  const filteredOptions = q
    ? ['all', ...options.filter(opt => opt !== 'all' && display(opt).toLowerCase().includes(q))]
    : options

  return (
    <label className="searchable-select">
      {label}
      <Combobox.Root
        value={value}
        onValueChange={(val) => onChange((val as string) ?? 'all')}
        onInputValueChange={(val) => setInputValue(val)}
        onOpenChange={(open) => setIsOpen(open)}
        itemToStringLabel={(item) => isOpen ? '' : display(item as string)}
      >
        <div className="searchable-select-control">
          <Combobox.Input className="searchable-select-input" placeholder={inputHint} />
          <ChevronDown size={14} className="searchable-select-chevron" />
        </div>
        <Combobox.Portal>
          <Combobox.Positioner side="bottom" align="start" sideOffset={4}>
            <Combobox.Popup className="searchable-select-popup">
              <Combobox.List>
                {filteredOptions.map(opt => (
                  <Combobox.Item key={opt} value={opt} className="searchable-select-item">
                    {display(opt)}
                  </Combobox.Item>
                ))}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </label>
  )
}
