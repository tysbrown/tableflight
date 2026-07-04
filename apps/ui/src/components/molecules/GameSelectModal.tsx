import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { gql, useMutation } from 'urql'
import tw from 'twin.macro'
import type { Game } from '~common'
import { Button, List, ListItem, Modal, TextInput } from '@/atoms'
import { HeadlineSmall, BodyMedium } from '@/typography'
import { useBoard } from '@/hooks'

const createGameMutation = gql`
  mutation CreateGame($name: String!, $description: String) {
    createGame(name: $name, description: $description) {
      id
      name
      description
      image
    }
  }
`

type GameSelectModalProps = {
  games: Game[] | undefined
}

type CreateGameFields = {
  name: string
  description?: string
}

const GameSelectModal = ({ games }: GameSelectModalProps) => {
  const [selected, setSelected] = useState<string>('')
  const { gameSessionId, setGameSessionId } = useBoard()

  const [{ fetching }, createGame] = useMutation(createGameMutation)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const enterSession = (id: string) => setGameSessionId(id)

  const onCreate = async ({ name, description }: Partial<CreateGameFields>) => {
    const result = await createGame({ name, description })

    if (result.error) {
      console.error(result.error)
      return
    }

    const newGame = result.data?.createGame as Game | undefined
    if (newGame?.id) enterSession(newGame.id)
  }

  return (
    <Modal
      isOpen={!gameSessionId}
      noHeading
      noCloseOnOutsideClick
      css={[tw`bg-surfaceContainerHigh p-6 rounded-3xl`]}
    >
      <HeadlineSmall>Games</HeadlineSmall>
      <BodyMedium>
        Welcome back! Please select the game session you&apos;d like to load
        from the list below, or create a new one.
      </BodyMedium>

      <List css={[tw`my-6`]}>
        {games?.map(({ id, image, name, description }, index) => (
          <ListItem
            key={id}
            image={image}
            title={name}
            description={description}
            showArrow
            onClick={() => setSelected(id)}
            css={[
              tw`py-4 px-2 cursor-pointer`,
              tw`hover:bg-surfaceContainerHighest`,
              selected === id && tw`bg-surfaceContainerHighest`,
              index !== games.length - 1 && tw`border-b border-outlineVariant`,
            ]}
          />
        ))}
      </List>

      <section css={[tw`flex justify-end`]}>
        <Button
          onClick={() => enterSession(selected)}
          style="primary"
          type="button"
          disabled={!selected}
        >
          Select
        </Button>
      </section>

      <hr css={[tw`my-6 border-outlineVariant`]} />

      <form onSubmit={handleSubmit(onCreate)} css={[tw`grid gap-4`]}>
        <TextInput
          type="text"
          name="name"
          label="New game name"
          required
          register={register}
          hasError={errors.name}
        />
        <TextInput
          type="text"
          name="description"
          label="Description (optional)"
          register={register}
          hasError={errors.description}
        />
        <section css={[tw`flex justify-end`]}>
          <Button style="outline" type="submit" disabled={fetching}>
            {fetching ? 'Creating...' : 'Create New'}
          </Button>
        </section>
      </form>
    </Modal>
  )
}

export default GameSelectModal
