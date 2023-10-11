import type { ReactNode, RefObject } from "react"
import tw from "twin.macro"

type MenuProps = {
  isOpen: boolean
  anchorElement: RefObject<HTMLElement>
  children: ReactNode
}

export const Menu = ({ isOpen, anchorElement, children }: MenuProps) => {
  if (!isOpen) return null

  // Guard against null or undefined values
  if (!anchorElement.current) return null

  const { top, left, right, height, width } =
    anchorElement.current.getBoundingClientRect()

  return (
    <ul
      css={[
        tw`absolute z-[99999] flex flex-col bg-surfaceContainer rounded-md overflow-visible`,
        `
          top: ${top + height}px;
          right: ${right - left - width}px;
        `,
      ]}
    >
      {children}
    </ul>
  )
}

export const MenuItem = ({
  children,
  ...remainingProps
}: {
  children: ReactNode
}) => {
  return (
    <li
      css={[
        tw`bg-surfaceContainerHighest py-2 px-3 z-[99999] min-w-[250px] overflow-visible`,
      ]}
      {...remainingProps}
    >
      {children}
    </li>
  )
}
