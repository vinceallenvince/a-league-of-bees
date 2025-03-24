import * as React from "react"

const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

// Mock Implementation of Select Components
export interface SelectProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const Select = ({ children, ...props }: SelectProps) => {
  return <div {...props}>{children}</div>
}

export const SelectTrigger = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      className={cn("flex items-center justify-between rounded-md", className)}
      {...props}
    >
      {children}
    </button>
  )
}

export const SelectValue = ({
  className,
  placeholder,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }) => {
  return (
    <span className={className} {...props}>
      {children || placeholder}
    </span>
  )
}

export const SelectContent = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn("bg-white rounded-md shadow-md", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export const SelectItem = ({
  className,
  children,
  value,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) => {
  return (
    <div
      className={cn("cursor-pointer px-2 py-1.5 hover:bg-gray-100", className)}
      data-value={value}
      {...props}
    >
      {children}
    </div>
  )
} 