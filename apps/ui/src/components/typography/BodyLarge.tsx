import tw from 'twin.macro'
import { ComponentProps } from '~common'

const BodyLarge = ({ children, ...css }: ComponentProps) => {
  return (
    <p css={[tw`text-base font-normal tracking-[0.5px]`]} {...css}>
      {children}
    </p>
  )
}

export default BodyLarge
