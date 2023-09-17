import tw from "twin.macro"

type ButtonProps = {
  /**
   * The button variation
   */
  style: "primary" | "secondary" | "tertiary" | "outline" | "link"
  /**
   * The button type
   */
  type: "submit" | "reset" | "button"
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
}

const Button = ({
  style,
  type,
  disabled,
  onClick,
  children,
  ...remainingProps
}: ButtonProps) => {
  const styles = {
    primary: tw`bg-primary border border-primary text-onPrimary primaryHoverOverlay primaryFocusOverlay`,
    secondary: tw`bg-secondary text-onSecondary`,
    outline: tw`bg-none border border-outline text-primary outlineHoverOverlay outlineFocusOverlay`,
    tertiary: tw`bg-tertiary border border-tertiary text-onTertiary`,
    link: tw`bg-none text-sm p-0 rounded-none text-primary underline`,
  }

  return (
    <button
      onClick={onClick}
      css={[tw`font-medium w-fit px-6 py-2 rounded-full`, styles[style]]}
      type={type}
      disabled={disabled}
      {...remainingProps}
    >
      {children}
    </button>
  )
}

export default Button
