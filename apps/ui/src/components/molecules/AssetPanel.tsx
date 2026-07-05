import { useState } from 'react'
import tw from 'twin.macro'
import { FileInput } from '@/atoms'
import { useAssets, type StagedAsset } from '@/hooks'

/** The user's asset library: upload to stage, drag a thumbnail to place. */
const AssetPanel = () => {
  const { assets, error, uploading, uploadFile, removeAsset } = useAssets()
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null
    if (file) {
      setUploadError(null)
      uploadFile(file).catch((cause: unknown) => {
        console.error('Failed to upload the asset:', cause)
        setUploadError(
          `Couldn't upload ${file.name}. Use a png, jpeg, webp, or gif under 10MB.`,
        )
      })
    }
    event.target.value = '' // let the same file be re-selected
  }

  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    asset: StagedAsset,
  ) => {
    event.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        asset: { url: asset.url, width: asset.width, height: asset.height },
      }),
    )
  }

  return (
    <article>
      <h2 css={[tw`mb-1`]}>Assets</h2>
      <p css={[tw`mb-3 text-sm text-onSurfaceVariant`]}>
        Upload images, then drag them onto the board to place them.
      </p>
      <FileInput onChange={handleFileChange} css={[tw`h-fit`]} />
      {uploading && <p css={[tw`mt-2 text-sm`]}>Uploading…</p>}
      {uploadError && (
        <p role="alert" css={[tw`mt-2 text-sm text-error`]}>
          {uploadError}
        </p>
      )}
      {error && (
        <p css={[tw`mt-2 text-sm text-error`]}>Failed to load your assets.</p>
      )}

      <section data-testid="asset-library" css={[tw`flex flex-wrap gap-3 mt-3`]}>
        {assets.map((asset) => (
          <div
            key={asset.id}
            draggable
            onDragStart={(event) => handleDragStart(event, asset)}
            css={[tw`relative cursor-grab`]}
          >
            <img
              src={asset.url}
              alt={asset.name}
              draggable={false}
              css={[tw`max-h-[100px] rounded pointer-events-none`]}
            />
            <button
              type="button"
              aria-label={`Remove ${asset.name}`}
              onClick={() => {
                removeAsset(asset.id).catch((removeError: unknown) => {
                  console.error('Failed to remove the asset:', removeError)
                })
              }}
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

export default AssetPanel
