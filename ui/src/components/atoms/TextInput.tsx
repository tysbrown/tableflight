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
  /**
   * Disables autocomplete for the input field.
   *
   * @default false
   */
  noAutoComplete?: boolean
  /**
   *
   * @param arg1 - The name of the input field
   * @param arg2 - Options object
   * @returns - The return value of react-hook-form's `register` function
   */
  register: (arg1: string, arg2: object) => UseFormRegisterReturn
  /**
   *
   * @param arg1 - The value of the input field
   * @param arg2 - The entire form values object
   * @returns - A boolean indicating whether the input field is valid
   */
  validate?: (arg1: string, arg2: SignUpFormValues) => boolean
  /**
   * The error object returned by react-hook-form's `errors` object.
   */
  hasError:
    | FieldError
    | Merge<FieldError, FieldErrorsImpl<FieldValues>>
    | undefined
}

/**
 * A text input field with a floating label and animated bottom border.
 *
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
