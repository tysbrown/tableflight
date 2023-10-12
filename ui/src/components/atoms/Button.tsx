import { forwardRef, LegacyRef } from "react"
import tw from "twin.macro"

type ButtonProps = {
  style: "primary" | "secondary" | "tertiary" | "outline" | "link" | "text"
  type: "submit" | "reset" | "button"
  disabled?: boolean
  onClick?: () => void
  ref?: LegacyRef<HTMLButtonElement> | undefined
  children: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      style,
      type,
      disabled,
      onClick,
      children,
      ...remainingProps
    }: ButtonProps,
    ref,
  ) => {
    const styles = {
      primary: tw`bg-primary border border-primary text-onPrimary primaryHoverOverlay primaryFocusOverlay`,
      secondary: tw`bg-secondary text-onSecondary`,
      outline: tw`bg-none border border-outline text-primary outlineHoverOverlay outlineFocusOverlay`,
      tertiary: tw`bg-tertiary border border-tertiary text-onTertiary`,
      link: tw`bg-none text-sm p-0 rounded-none text-primary underline`,
      text: tw`bg-none text-sm p-0 rounded-none`,
    }

    return (
      <button
        onClick={onClick}
        css={[tw`font-medium w-fit px-6 py-2 rounded-full`, styles[style]]}
        type={type}
        disabled={disabled}
        {...remainingProps}
        ref={ref}
      >
        {children}
      </button>
    )
  },
)

export default Button
