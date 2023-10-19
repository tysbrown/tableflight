import tw from "twin.macro"

const BodyMedium = ({ children, ...props }: { children: React.ReactNode }) => {
  return (
    <p css={[tw`text-sm font-normal tracking-[0.25px]`]} {...props}>
      {children}
    </p>
  )
}

export default BodyMedium
