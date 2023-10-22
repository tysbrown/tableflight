import React from "react"
import tw from "twin.macro"
import type { Game } from "@/types"
import { Button, List, ListItem, Modal } from "@/atoms"
import { HeadlineSmall, BodyMedium } from "@/typography"
import { useGridState } from "@/hooks/useGridState"
import { GridState } from "@/contexts/GridStateProvider"

type GameSelectModalProps = {
  games: Game[]
}

const GameSelectModal = ({ games }: GameSelectModalProps) => {
  const [selected, setSelected] = React.useState<number>(0)
  const { state, dispatch } = useGridState()
  const { gameSessionId } = state as GridState

  return (
    <Modal
      isOpen={!gameSessionId}
      noHeading
      noCloseOnOutsideClick
      css={[tw`bg-surfaceContainerHigh p-6 rounded-3xl`]}
    >
      <HeadlineSmall>Games</HeadlineSmall>
      <BodyMedium>
        Welcome back! Please select the game session you'd like to load from the
        list below, or create a new one.
      </BodyMedium>
      <List css={[tw`my-6`]}>
        {games.map(({ id, image, name, description }, index) => (
          <>
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
              ]}
            />
            {index !== games.length - 1 && (
              <hr css={[tw`border-outlineVariant`]} />
            )}
          </>
        ))}
      </List>
      <section css={[tw`flex justify-end gap-2`]}>
        <Button style="outline" type="button">
          Create New
        </Button>
        <Button
          onClick={() =>
            dispatch({ type: "SET_GAME_SESSION_ID", gameSessionId: selected })
          }
          style="primary"
          type="button"
        >
          Select
        </Button>
      </section>
    </Modal>
  )
}

export default GameSelectModal
