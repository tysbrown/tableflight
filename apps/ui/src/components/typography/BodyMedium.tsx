import { ComponentProps } from '~common'
import tw from 'twin.macro'

const BodyMedium = ({ children, ...css }: ComponentProps) => {
  return (
    <p css={[tw`text-sm font-normal tracking-[0.25px]`]} {...css}>
      {children}
    </p>
  )
}

export default BodyMedium
