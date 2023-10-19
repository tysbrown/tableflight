import {
  FieldError,
  FieldErrorsImpl,
  FieldValues,
  Merge,
  UseFormRegisterReturn,
} from "react-hook-form"
import type { SignUpFormValues } from "@/molecules"
import tw from "twin.macro"

type TextInputProps = {
  name: string
  type: "text" | "email" | "password"
  label: string
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
 * @todo - Add support for textarea
 * @todo - Add disable prop and style
 */
const TextInput = ({
  name,
  type,
  label,
  required = false,
  noAutoComplete = false,
  register,
  validate,
  hasError,
  ...remaining
}: TextInputProps) => {
  return (
    <div css={[tw`relative w-full h-14`]} className="group" {...remaining}>
      <input
        type={type}
        autoComplete={noAutoComplete ? "new-password" : ""}
        aria-invalid={hasError ? "true" : "false"}
        aria-required={required}
        placeholder=" "
        css={[
          tw`w-full h-full px-4 pb-0 py-5 rounded-t-md caret-onSurface border-b border-onSurface bg-surfaceContainerLow input-bg-surfaceContainerLow`,
          tw`group-hover:(border-white bg-surfaceContainer)`,
          tw`focus:outline-none`,
        ]}
        className="peer"
        {...register(name, { validate: validate, required })}
      />
      <label
        htmlFor={name}
        css={[
          tw`absolute top-1/2 -translate-y-1/2 left-4 transition-all transform origin-top-left ease-in-out duration-200 cursor-text`,
          tw`peer-focus:(translate-y-0 top-2 scale-75)`,
          tw`peer-autofill:(translate-y-0 top-2 scale-75 text-primary)`,
          tw`peer-[:not(:placeholder-shown)]:(translate-y-0 top-2 scale-75)`,
          hasError
            ? tw`peer-focus:text-error text-error translate-y-0 top-2 scale-75`
            : tw`peer-focus:text-primary peer-[:not(:placeholder-shown)]:text-primary text-onSurface`,
        ]}
      >
        {label}
      </label>
      <div
        css={[
          tw`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 transition-all duration-200 ease-in-out`,
          tw`peer-focus:w-full`,
          tw`peer-autofill:w-full`,
          tw`peer-[:not(:placeholder-shown)]:w-full`,
          hasError
            ? tw`peer-focus:bg-error peer-autofill:bg-error bg-error w-full`
            : tw`bg-primary`,
        ]}
      />
    </div>
  )
}

export default TextInput
