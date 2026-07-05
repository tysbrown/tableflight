import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider, type Client } from 'urql'
import { fromValue } from 'wonka'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AssetPanel from './AssetPanel'

const stagedAssets = [
  {
    id: 'a1',
    name: 'dungeon.png',
    url: '/api/assets/a1',
    width: 800,
    height: 600,
  },
  {
    id: 'a2',
    name: 'tavern.png',
    url: '/api/assets/a2',
    width: 400,
    height: 300,
  },
]

/** Mock urql client (see GameSelectModal.test.tsx). */
const makeClient = () => {
  const executeQuery = vi.fn(() =>
    fromValue({ data: { myAssets: stagedAssets } }),
  )
  const executeMutation = vi.fn(() =>
    fromValue({
      data: {
        uploadAsset: {
          id: 'a3',
          name: 'new-map.png',
          url: '/api/assets/a3',
          width: 640,
          height: 480,
        },
        deleteAsset: { id: 'a1' },
      },
    }),
  )
  const client = {
    executeQuery,
    executeMutation,
    executeSubscription: vi.fn(() => fromValue({ data: {} })),
  } as unknown as Client

  return { client, executeQuery, executeMutation }
}

const renderPanel = (client: Client) =>
  render(
    <Provider value={client}>
      <AssetPanel />
    </Provider>,
  )

beforeEach(() => {
  // jsdom's Image never actually loads; give measureImage real dimensions.
  vi.stubGlobal(
    'Image',
    class {
      naturalWidth = 640
      naturalHeight = 480
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_value: string) {
        queueMicrotask(() => this.onload?.())
      }
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AssetPanel', () => {
  it('renders the staged asset library from myAssets', () => {
    const { client } = makeClient()
    renderPanel(client)

    expect(screen.getByAltText('dungeon.png')).toBeInTheDocument()
    expect(screen.getByAltText('tavern.png')).toBeInTheDocument()
  })

  it('uploading a file only stages it (uploadAsset mutation, no board call)', async () => {
    const { client, executeMutation } = makeClient()
    const { container } = renderPanel(client)

    const file = new File(['fake-image-bytes'], 'new-map.png', {
      type: 'image/png',
    })
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await userEvent.upload(input, file)

    await waitFor(() => expect(executeMutation).toHaveBeenCalledTimes(1))
    expect(executeMutation.mock.calls[0]?.[0]).toMatchObject({
      variables: {
        name: 'new-map.png',
        dataUrl: expect.stringMatching(/^data:image\/png;base64,/),
        width: 640,
        height: 480,
      },
    })
  })

  it('dragging a thumbnail carries the asset drop payload', () => {
    const { client } = makeClient()
    renderPanel(client)

    const setData = vi.fn()
    fireEvent.dragStart(
      screen.getByAltText('dungeon.png').parentElement as HTMLElement,
      { dataTransfer: { setData } },
    )

    expect(setData).toHaveBeenCalledWith(
      'application/json',
      JSON.stringify({
        asset: { url: '/api/assets/a1', width: 800, height: 600 },
      }),
    )
  })

  it('a rejected upload shows a visible error', async () => {
    const { client, executeMutation } = makeClient()
    executeMutation.mockReturnValueOnce(
      fromValue({
        // urql surfaces GraphQL errors on result.error
        error: new Error('The image is larger than the 10MB limit.'),
      } as never),
    )
    const { container } = renderPanel(client)

    const file = new File(['x'], 'huge.png', { type: 'image/png' })
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement
    await userEvent.upload(input, file)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "Couldn't upload huge.png",
    )
  })

  it('the remove button deletes from the library', async () => {
    const { client, executeMutation } = makeClient()
    renderPanel(client)

    await userEvent.click(
      screen.getByRole('button', { name: 'Remove dungeon.png' }),
    )

    await waitFor(() => expect(executeMutation).toHaveBeenCalledTimes(1))
    expect(executeMutation.mock.calls[0]?.[0]).toMatchObject({
      variables: { id: 'a1' },
    })
  })
})
