type ButtonProps = {
  style: "primary" | "secondary" | "tertiary" | "outline" | "link"
  type: "submit" | "reset" | "button"
  disabled?: boolean
  className?: string
  onClick?: () => void
  children: React.ReactNode
}

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
    primary: "bg-primary text-onPrimary",
    secondary: "bg-secondary text-onSecondary",
    outline: "bg-none border-outline text-primary",
    tertiary: "bg-tertiary text-onTertiary",
    link: "bg-none text-sm text-blue-500",
  }

  return (
    <button
      onClick={() => onClick}
      className={`${className} ${styles[style]} font-medium border w-fit px-6 py-2 rounded-full`}
      type={type}
      disabled={disabled}
      {...remainingProps}
    >
      {children}
    </button>
  )
}

export default Button
