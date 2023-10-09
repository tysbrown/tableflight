import { Children, Ref } from "react"
import tw from "twin.macro"

type MenuProps = {
  isOpen: boolean
  anchorElement: Ref<HTMLElement>
  children: React.ReactNode
}

export const Menu = ({ isOpen, anchorElement, children }: MenuProps) => {
  if (!isOpen) return null

  const { top, left, height } = anchorElement!.current!.getBoundingClientRect()

  return (
    <ul
      css={[
        tw`absolute`,
        `
          top: ${top + height}px;
          left: ${left}px;
        `,
      ]}
    >
      {Children.map(children, (child) => (
        <li>{child}</li>
      ))}
    </ul>
  )
}

export const MenuItem = ({ children }: { children: React.ReactNode }) => {
  return (
    <li>
      {children}
    </li>
  )
}