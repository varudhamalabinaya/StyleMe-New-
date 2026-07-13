import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import './ui.css'

type InputProps = {
  label: string
  id: string
} & InputHTMLAttributes<HTMLInputElement>

export function TextField({ label, id, className = '', ...rest }: InputProps) {
  return (
    <div className="ui-field">
      <label className="ui-label" htmlFor={id}>
        {label}
      </label>
      <input id={id} className={`ui-input ${className}`.trim()} {...rest} />
    </div>
  )
}

type AreaProps = {
  label: string
  id: string
} & TextareaHTMLAttributes<HTMLTextAreaElement>

export function TextArea({ label, id, className = '', ...rest }: AreaProps) {
  return (
    <div className="ui-field">
      <label className="ui-label" htmlFor={id}>
        {label}
      </label>
      <textarea id={id} className={`ui-textarea ${className}`.trim()} {...rest} />
    </div>
  )
}

type SelectProps = {
  label: string
  id: string
  children: ReactNode
} & SelectHTMLAttributes<HTMLSelectElement>

export function Select({ label, id, children, className = '', ...rest }: SelectProps) {
  return (
    <div className="ui-field">
      <label className="ui-label" htmlFor={id}>
        {label}
      </label>
      <div className="ui-select-wrap">
        <select id={id} className={`ui-select ${className}`.trim()} {...rest}>
          {children}
        </select>
      </div>
    </div>
  )
}
