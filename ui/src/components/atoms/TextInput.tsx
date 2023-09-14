import { UseFormRegisterReturn } from "react-hook-form"

type TextInputProps = {
  name: string
  type: "text" | "email" | "password"
  label: string
  className?: string
  required?: boolean
  register: (arg1: string, arg2: object) => UseFormRegisterReturn
}

/**
 * A text input field with a floating label
 *
 * @param {string} name - The name of the input field
 * @param {string} type - The type of the input field
 * @param {string} label - The label of the input field
 * @param {string} className - Any styles passed from the component declaration
 * @param {boolean} required - For validation
 * @param {function} register - The register function from react-hook-form
 */

const TextInput = ({
  name,
  type,
  label,
  className,
  required = false,
  register,
}: TextInputProps) => {
  return (
    <div className="relative w-full h-14 mb-3">
      <input
        type={type}
        placeholder=" "
        className={`
          ${className} peer w-full h-full px-4 pb-0 py-5 rounded-t-md caret-onSurface border-b
          border-onSurface bg-surfaceContainerHighest input-bg-surfaceContainerHighest 
          focus:outline-none 
          hover:border-white hover:bg-surfaceContainerHighest
        `}
        {...register(name, { required })}
      />
      <label
        htmlFor={name}
        className={`
          absolute top-1/2 -translate-y-1/2 left-4 text-onSurface transition-all transform 
          origin-top-left ease-in-out duration-300 
          peer-focus:translate-y-0 peer-focus:top-2 peer-focus:scale-75 peer-focus:text-primary 
          peer-autofill:translate-y-0 peer-autofill:top-2 peer-autofill:scale-75 peer-autofill:text-primary 
          peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:scale-75 
          peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-primary
        `}
      >
        {label}
      </label>
      <div
        className={`
          absolute bottom-0 left-1/2 -translate-x-1/2 bg-primary w-0 h-0.5 transition-all
          duration-300 ease-in-out peer-focus:w-full peer-autofill:w-full 
          peer-[:not(:placeholder-shown)]:w-full
        `}
      />
    </div>
  )
}

export default TextInput
