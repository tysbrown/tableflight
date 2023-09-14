type ButtonProps = {
  style: "primary" | "secondary" | "tertiary" | "outline" | "link"
  type: "submit" | "reset" | "button"
  disabled?: boolean
  className?: string
  onClick?: () => void
  children: React.ReactNode
}

/**
 * Button element with styles for each Material Design variation.
 *
 * @param {string} style - The button variation
 * @param {string} type - The button type
 * @param {boolean} disabled - Controls button's disabled state
 * @param {string} className - Styles to pass down from component declaration
 * @param {() => void} onClick - A callback function containing code to execute on click
 *
 * @returns {HTMLButtonElement} <button></button>
 */

const Button = ({
  style,
  type,
  disabled,
  className,
  onClick,
  children,
  ...remainingProps
}: ButtonProps) => {
  const styles = {
    primary:
      "bg-primary border border-primary text-onPrimary primaryHoverOverlay primaryFocusOverlay",
    secondary: "bg-secondary text-onSecondary",
    outline:
      "bg-none border border-outline text-primary outlineHoverOverlay outlineFocusOverlay",
    tertiary: "bg-tertiary border border-tertiary text-onTertiary",
    link: "bg-none text-sm",
  }

  return (
    <button
      onClick={onClick}
      className={`${className} ${styles[style]} font-medium w-fit px-6 py-2 rounded-full`}
      type={type}
      disabled={disabled}
      {...remainingProps}
    >
      {children}
    </button>
  )
}

export default Button
