import tw from 'twin.macro'
import { FileInput } from '@/atoms'
import { useGridState } from '@/hooks'
import { GridState } from '@/contexts'

const UploadMapPanel = () => {
  const { state, dispatch } = useGridState()
  const { backgroundImage }: GridState = state as GridState

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        dispatch({
          type: 'SET_BACKGROUND',
          backgroundImage: reader.result as string,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <article>
      <h2 css={[tw`mb-3`]}>Set Map</h2>
      <section css={[tw`flex justify-start gap-3`]}>
        <FileInput onChange={handleFileChange} css={[tw`h-fit`]} />
        <img src={backgroundImage as string} alt="" css={[tw`max-h-[200px]`]} />
      </section>
    </article>
  )
}

export default UploadMapPanel
