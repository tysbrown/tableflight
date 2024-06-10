import tw from "twin.macro"

const HeadlineSmall = ({
  children,
  ...props
}: {
  children: React.ReactNode
}) => {
  return (
    <h6 css={[tw`text-2xl mb-4`]} {...props}>
      {children}
    </h6>
  )
}

export default HeadlineSmall
