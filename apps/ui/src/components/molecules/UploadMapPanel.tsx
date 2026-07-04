import tw from 'twin.macro'
import { FileInput } from '@/atoms'
import { useBoard } from '@/hooks'

/**
 * Adds map images to the board. Each upload is placed at the center of the
 * current view — the board is one open world, so maps accumulate rather than
 * replace each other.
 */
const UploadMapPanel = () => {
  const { maps, addMap, removeMap } = useBoard()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        void addMap(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <article>
      <h2 css={[tw`mb-3`]}>Add Map</h2>
      <FileInput onChange={handleFileChange} css={[tw`h-fit`]} />
      <section css={[tw`flex flex-wrap gap-3 mt-3`]}>
        {maps.map(({ id, url }) => (
          <div key={id} css={[tw`relative`]}>
            <img src={url} alt="" css={[tw`max-h-[100px] rounded`]} />
            <button
              type="button"
              aria-label="Remove map"
              onClick={() => removeMap(id)}
              css={[
                tw`absolute top-1 right-1 w-5 h-5 flex items-center justify-center`,
                tw`rounded-full bg-scrim/70 text-white text-xs leading-none`,
              ]}
            >
              ×
            </button>
          </div>
        ))}
      </section>
    </article>
  )
}

export default UploadMapPanel
