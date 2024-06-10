import tw from "twin.macro"
import { LoadingIndicator } from "@/atoms"

const LoadingView = () => (
  <section css={[tw`flex justify-center items-center min-h-screen`]}>
    <LoadingIndicator />
  </section>
)

export default LoadingView
