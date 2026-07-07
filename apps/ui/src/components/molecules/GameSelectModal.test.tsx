import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider, type Client } from 'urql'
import { fromValue } from 'wonka'
import { describe, expect, it, vi } from 'vitest'
import type { Game } from '~common'
import { BoardProvider } from '@/contexts'
import GameSelectModal from './GameSelectModal'

/**
 * The modal only reads id/name/description/image off each game, so a partial
 * object cast to Game keeps the fixtures readable.
 */
const games = [
  {
    id: '10',
    name: 'Existing Campaign',
    description: 'A previously saved session',
    image: 'placeholder',
  },
] as unknown as Game[]

/**
 * A mock urql client — the idiomatic way to test urql-connected components.
 * `executeMutation` returns a wonka source so `useMutation` resolves with it.
 */
const makeClient = (
  executeMutation = vi.fn((..._args: unknown[]) =>
    fromValue({
      data: {
        createGame: {
          id: '20',
          name: 'Brand New Game',
          description: '',
          image: 'placeholder',
        },
      },
    }),
  ),
) => {
  const client = {
    executeQuery: vi.fn(() => fromValue({ data: {} })),
    executeMutation,
    executeSubscription: vi.fn(() => fromValue({ data: {} })),
  } as unknown as Client

  return { client, executeMutation }
}

const renderModal = (client: Client, gameList: Game[] | undefined = games) =>
  render(
    <Provider value={client}>
      <BoardProvider>
        <GameSelectModal games={gameList} />
      </BoardProvider>
    </Provider>,
  )

// The modal renders into a portal, so query the whole document.
const nameInput = () =>
  document.querySelector('input[name="name"]') as HTMLInputElement

describe('GameSelectModal', () => {
  it('is open on mount because no game session is active', () => {
    const { client } = makeClient()
    renderModal(client)

    expect(screen.getByText(/Welcome back!/)).toBeInTheDocument()
  })

  it('creates a new game via the createGame mutation and closes the modal', async () => {
    const { client, executeMutation } = makeClient()
    renderModal(client)

    await userEvent.type(nameInput(), 'Brand New Game')
    await userEvent.click(screen.getByRole('button', { name: 'Create New' }))

    expect(executeMutation).toHaveBeenCalledTimes(1)
    expect(executeMutation.mock.calls[0]?.[0]).toMatchObject({
      variables: { name: 'Brand New Game' },
    })

    // Entering the returned session id closes the modal.
    await waitFor(() =>
      expect(screen.queryByText(/Welcome back!/)).not.toBeInTheDocument(),
    )
  })

  it('does not fire the mutation when no game name is entered', async () => {
    const { client, executeMutation } = makeClient()
    renderModal(client)

    await userEvent.click(screen.getByRole('button', { name: 'Create New' }))

    expect(executeMutation).not.toHaveBeenCalled()
    expect(screen.getByText(/Welcome back!/)).toBeInTheDocument()
  })

  it('disables Select until a game is chosen, then enters that session', async () => {
    const { client, executeMutation } = makeClient()
    renderModal(client)

    const selectButton = screen.getByRole('button', { name: 'Select' })
    expect(selectButton).toBeDisabled()

    await userEvent.click(screen.getByText('Existing Campaign'))
    expect(selectButton).toBeEnabled()

    await userEvent.click(selectButton)

    await waitFor(() =>
      expect(screen.queryByText(/Welcome back!/)).not.toBeInTheDocument(),
    )
    // Selecting an existing game must not hit the create mutation.
    expect(executeMutation).not.toHaveBeenCalled()
  })
})
