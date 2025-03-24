import * as React from "react"

// Simple utility function for class names
const cn = (...inputs: any[]) => inputs.filter(Boolean).join(' ');

/**
 * Form components mocked for testing
 */

// Form Root
export const Form = ({
  children,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement>) => (
  <form {...props}>{children}</form>
)

// Form Field
export const FormField = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-2">{children}</div>
)

// Form Item
export const FormItem = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-1">{children}</div>
)

// Form Label
export const FormLabel = ({
  children,
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("text-sm font-medium", className)} {...props}>
    {children}
  </label>
)

// Form Control
export const FormControl = ({ 
  children 
}: { 
  children: React.ReactNode 
}) => (
  <div className="mt-2">{children}</div>
)

// Form Description
export const FormDescription = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  >
    {children}
  </p>
)

// Form Message
export const FormMessage = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("text-sm font-medium text-destructive", className)}
    {...props}
  >
    {children}
  </p>
)

// Form Error
export const FormError = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("text-sm font-medium text-red-500", className)}
    {...props}
  >
    {children}
  </p>
) 