import React from "react"
import tw from "twin.macro"
import Modal from "../atoms/Modal"
import { Game } from "@/types"
import { List, ListItem } from "../atoms/List"
import HeadlineSmall from "../atoms/HeadlineSmall"
import BodyMedium from "../atoms/BodyMedium"

type GameSelectModalProps = {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  games: Game[]
}

const GameSelectModal = ({
  isOpen,
  setIsOpen,
  games,
}: GameSelectModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      noHeading
      noCloseOnOutsideClick
      css={[tw`bg-surfaceContainerHigh p-6 rounded-3xl`]}
    >
      <HeadlineSmall>Games</HeadlineSmall>
      <BodyMedium>
        Welcome back! Please select the game session you'd like to load from the
        list below, or create a new one.
      </BodyMedium>
      <List css={[tw`mt-6 gap-y-4`]}>
        {games.map(({ id, image, name, description }, index) => (
          <>
            <ListItem
              key={id}
              image={image}
              title={name}
              description={description}
            />
            {index !== games.length - 1 && (
              <hr css={[tw`border-outlineVariant`]} />
            )}
          </>
        ))}
      </List>
    </Modal>
  )
}

export default GameSelectModal
