import { useCallback } from 'react'
import { gql, useMutation, useQuery } from 'urql'

export type StagedAsset = {
  id: string
  name: string
  url: string
  width: number
  height: number
}

/** The payload an asset thumbnail carries onto the board. */
export type DroppedAssetData = {
  url: string
  width: number
  height: number
}

const myAssetsQuery = gql`
  query MyAssets {
    myAssets {
      id
      name
      url
      width
      height
    }
  }
`

const uploadAssetMutation = gql`
  mutation UploadAsset(
    $name: String!
    $dataUrl: String!
    $width: Int!
    $height: Int!
  ) {
    uploadAsset(name: $name, dataUrl: $dataUrl, width: $width, height: $height) {
      id
      name
      url
      width
      height
    }
  }
`

const deleteAssetMutation = gql`
  mutation DeleteAsset($id: ID!) {
    deleteAsset(id: $id) {
      id
    }
  }
`

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read the file'))
    reader.onloadend = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })

export const measureImage = (dataUrl: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image()
    image.onload = () =>
      resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('The file is not a valid image'))
    image.src = dataUrl
  })

/**
 * The user's asset library. Uploading only stages an image (persisted per
 * user); placement is a separate drag-and-drop from the panel.
 */
export const useAssets = () => {
  const [{ data, fetching, error }, refetchAssets] = useQuery<{
    myAssets: StagedAsset[]
  }>({ query: myAssetsQuery })

  const [uploadState, uploadAsset] = useMutation(uploadAssetMutation)
  const [, deleteAsset] = useMutation(deleteAssetMutation)

  const refetch = useCallback(
    () => refetchAssets({ requestPolicy: 'network-only' }),
    [refetchAssets],
  )

  const uploadFile = useCallback(
    async (file: File) => {
      const dataUrl = await readFileAsDataUrl(file)
      const { width, height } = await measureImage(dataUrl)

      const result = await uploadAsset({
        name: file.name,
        dataUrl,
        width,
        height,
      })
      if (result.error) throw result.error
      refetch()
    },
    [uploadAsset, refetch],
  )

  const removeAsset = useCallback(
    async (id: string) => {
      const result = await deleteAsset({ id })
      if (result.error) throw result.error
      refetch()
    },
    [deleteAsset, refetch],
  )

  return {
    assets: data?.myAssets ?? [],
    fetching,
    error,
    uploading: uploadState.fetching,
    uploadFile,
    removeAsset,
  }
}
