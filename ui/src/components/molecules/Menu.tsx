import tw from "twin.macro"

type MenuProps = {
  children: React.ReactNode
}

const Menu = ({ children }: MenuProps) => {
  return (
    <nav
      css={[
        tw`w-80 h-screen bg-surfaceContainer px-6 py-4`,
      ]}
    >
      {children}
    </nav>
  )
}

export default Menu
