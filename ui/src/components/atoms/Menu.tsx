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
 * - 320 is the width of the control panel.
 * - You need a hard value for height in order to animate it, so we use the scrollHeight from the ref.
 */
export const Menu = ({
  isOpen,
  anchorElement,
  children,
  ...props
}: MenuProps) => {
  const menuRef = useRef<HTMLUListElement | null>(null)
  const { offsetWidth: menuOffsetWidth, scrollHeight: menuHeight } =
    menuRef?.current || {}

  if (!anchorElement.current) return null

  const { left, right, bottom } = anchorElement.current.getBoundingClientRect()

  const viewportWidth = window.innerWidth - 320
  const menuWidth = menuOffsetWidth || 200
  const isCloseToRightEdge = right > viewportWidth - menuWidth - 20
  const leftValue = isCloseToRightEdge ? right - menuWidth : left

  return (
    <ul
      ref={menuRef}
      css={[
        tw`absolute flex flex-col bg-surfaceContainer rounded-md overflow-hidden z-50 h-0 opacity-0`,
        `
          top: ${bottom + 2}px;
          left: ${leftValue}px;
          transition: opacity 200ms linear, height 150ms ease-in-out;
        `,
        isOpen && tw`opacity-100`,
        isOpen && `height: ${menuHeight}px`,
      ]}
      {...props}
    >
      {children}
    </ul>
  )
}

export const MenuItem = ({ children, ...props }: { children: ReactNode }) => {
  return (
    <li
      css={[
        tw`bg-surfaceContainer h-10 py-2 px-3 min-w-[200px] cursor-pointer`,
        tw`hover:bg-surfaceContainerHighest`,
      ]}
      {...props}
    >
      {children}
    </li>
  )
}
