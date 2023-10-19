import tw from "twin.macro"

const BodyLarge = ({ children, ...props }: { children: React.ReactNode }) => {
  return (
    <p css={[tw`text-base font-normal tracking-[0.5px]`]} {...props}>
      {children}
    </p>
  )
}

export default BodyLarge
