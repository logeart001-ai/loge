import * as React from "react"
import { cn } from "@/lib/utils"

const MobileForm = React.forwardRef<
  HTMLFormElement,
  React.FormHTMLAttributes<HTMLFormElement>
>(({ className, ...props }, ref) => (
  <form
    ref={ref}
    className={cn("space-y-4 sm:space-y-6", className)}
    {...props}
  />
))
MobileForm.displayName = "MobileForm"

const MobileFormField = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-2", className)}
    {...props}
  />
))
MobileFormField.displayName = "MobileFormField"

const MobileFormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & {
    required?: boolean
  }
>(({ className, required, children, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium text-gray-700 leading-none",
      "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  >
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
))
MobileFormLabel.displayName = "MobileFormLabel"

const MobileFormInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-12 w-full rounded-md border border-gray-300 bg-white px-4 py-3",
      "text-base placeholder:text-gray-500",
      "focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "touch-manipulation", // Improves mobile input experience
      className
    )}
    ref={ref}
    {...props}
  />
))
MobileFormInput.displayName = "MobileFormInput"

const MobileFormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[120px] w-full rounded-md border border-gray-300 bg-white px-4 py-3",
      "text-base placeholder:text-gray-500 resize-y",
      "focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "touch-manipulation",
      className
    )}
    ref={ref}
    {...props}
  />
))
MobileFormTextarea.displayName = "MobileFormTextarea"

const MobileFormSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    className={cn(
      "flex h-12 w-full rounded-md border border-gray-300 bg-white px-4 py-3",
      "text-base focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "touch-manipulation",
      className
    )}
    ref={ref}
    {...props}
  >
    {children}
  </select>
))
MobileFormSelect.displayName = "MobileFormSelect"

const MobileFormError = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-red-600", className)}
    {...props}
  />
))
MobileFormError.displayName = "MobileFormError"

const MobileFormHelp = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
))
MobileFormHelp.displayName = "MobileFormHelp"

// Form group for better mobile layout
const MobileFormGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    columns?: 1 | 2
  }
>(({ className, columns = 1, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "grid gap-4",
      columns === 2 && "sm:grid-cols-2",
      className
    )}
    {...props}
  />
))
MobileFormGroup.displayName = "MobileFormGroup"

// Mobile-optimized form actions
const MobileFormActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: 'left' | 'center' | 'right' | 'between'
  }
>(({ className, align = 'right', ...props }, ref) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-4",
        alignClasses[align],
        className
      )}
      {...props}
    />
  )
})
MobileFormActions.displayName = "MobileFormActions"

export {
  MobileForm,
  MobileFormField,
  MobileFormLabel,
  MobileFormInput,
  MobileFormTextarea,
  MobileFormSelect,
  MobileFormError,
  MobileFormHelp,
  MobileFormGroup,
  MobileFormActions,
}