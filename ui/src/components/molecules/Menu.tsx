import tw from "twin.macro"

type MenuProps = {
  children: React.ReactNode
}

const Menu = ({ children }: MenuProps) => {
  return (
    <nav
      css={[
        tw`fixed right-2 top-2 bottom-2 w-80 bg-surfaceContainer rounded-md px-6 py-4`,
      ]}
    >
      {children}
    </nav>
  )
}

export default Menu
