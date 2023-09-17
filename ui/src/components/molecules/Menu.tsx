import tw from "twin.macro"

type MenuProps = {
  children: React.ReactNode
}

const Menu = ({ children }: MenuProps) => {
  return (
    <nav
      css={[
        tw`w-[300px] fixed right-2 top-2 bottom-2 bg-surfaceContainer rounded-md`,
      ]}
    >
      {children}
    </nav>
  )
}

export default Menu
