import { useRef, type ReactNode, type RefObject } from "react"
import tw from "twin.macro"

type MenuProps = {
  isOpen: boolean
  /**
   * The element that the menu should be positioned relative to.
   */
  anchorElement: RefObject<HTMLElement>
  children: ReactNode
}

/**
 * Dropdown menu component that dynamically positions itself relative to an anchor element
 * and the viewport.
 *
 * @remarks
 * 320 is the width of the control panel.
 */
export const Menu = ({ isOpen, anchorElement, children }: MenuProps) => {
  const menuRef = useRef<HTMLUListElement | null>(null)

  if (!isOpen) return null
  if (!anchorElement.current) return null

  const { top, left, right, height } =
    anchorElement.current.getBoundingClientRect()

  const viewportWidth = window.innerWidth - 320

  const menuWidth = menuRef?.current?.offsetWidth || 250

  const tooCloseToRightEdge = right > viewportWidth - menuWidth - 20

  const leftValue = tooCloseToRightEdge ? right - menuWidth : left

  return (
    <ul
      ref={menuRef}
      css={[
        tw`absolute z-50 flex flex-col bg-surfaceContainer rounded-md overflow-visible`,
        `
          top: ${top + height}px;
          left: ${leftValue}px;
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
      css={[tw`bg-surfaceContainer py-2 px-3 min-w-[250px] overflow-visible`]}
      {...remainingProps}
    >
      {children}
    </li>
  )
}
