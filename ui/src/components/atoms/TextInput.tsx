import {
  FieldError,
  FieldErrorsImpl,
  FieldValues,
  Merge,
  UseFormRegisterReturn,
} from "react-hook-form"
import { SignUpFormValues } from "../molecules/SignUpModal"

type TextInputProps = {
  name: string
  type: "text" | "email" | "password"
  label: string
  className?: string
  required?: boolean
  noAutoComplete?: boolean
  register: (arg1: string, arg2: object) => UseFormRegisterReturn
  validate?: (arg1: string, arg2: SignUpFormValues) => boolean
  hasError:
    | FieldError
    | Merge<FieldError, FieldErrorsImpl<FieldValues>>
    | undefined
}

/**
 * A text input field with a floating label and animated bottom border.
 *
 * @param {string} name - The name of the input field
 * @param {string} type - The type of the input field
 * @param {string} label - The label of the input field
 * @param {string} className - Any styles passed from the component declaration
 * @param {boolean} required - For validation
 * @param {function} register - The register function from react-hook-form
 * @param {function} validate - A function to validate the input field
 * @param {boolean} hasError - For validation
 * @param {boolean} noAutoComplete - For disabling autocomplete
 */

const TextInput = ({
  name,
  type,
  label,
  className,
  required = false,
  noAutoComplete = false,
  register,
  validate,
  hasError,
  ...remaining
}: TextInputProps) => {
  return (
    <div className={`${className} group relative w-full h-14`} {...remaining}>
      <input
        type={type}
        autoComplete={noAutoComplete ? "new-password" : ""}
        placeholder=" "
        className={`
          peer w-full h-full px-4 pb-0 py-5 rounded-t-md caret-onSurface border-b
          border-onSurface bg-surfaceContainerLow input-bg-surfaceContainerLow 
          focus:outline-none 
          group-hover:border-white group-hover:bg-surfaceContainer
        `}
        {...register(name, { validate: validate, required })}
      />
      <label
        htmlFor={name}
        className={`
          absolute top-1/2 -translate-y-1/2 left-4 transition-all transform origin-top-left ease-in-out 
          duration-200 cursor-text
          peer-focus:translate-y-0 peer-focus:top-2 peer-focus:scale-75 
          peer-autofill:translate-y-0 peer-autofill:top-2 peer-autofill:scale-75 peer-autofill:text-primary 
          peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:scale-75 
          peer-[:not(:placeholder-shown)]:top-2
          ${
            hasError
              ? "text-error peer-focus:text-error translate-y-0 top-2 scale-75"
              : "text-onSurface peer-focus:text-primary peer-[:not(:placeholder-shown)]:text-primary "
          }
        `}
      >
        {label}
      </label>
      <div
        className={`
          absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 transition-all
          duration-200 ease-in-out peer-focus:w-full peer-autofill:w-full 
          peer-[:not(:placeholder-shown)]:w-full 
          ${
            hasError
              ? "bg-error peer-focus:bg-error peer-autofill:bg-error w-full"
              : "bg-primary"
          }
        `}
      />
    </div>
  )
}

export default TextInput
