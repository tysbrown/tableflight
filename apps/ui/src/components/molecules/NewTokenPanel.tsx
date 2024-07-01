import type { TokenType } from "~common"
import tw from "twin.macro"

const NewTokenPanel = () => {
  const handleDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    token: Partial<TokenType>,
  ) => {
    const data = JSON.stringify({
      newToken: true,
      token,
    })

    event.dataTransfer.setData("application/json", data)
  }

  return (
    <article>
      <h3 css={[tw`mb-3`]}>Tokens</h3>
      <section css={[tw`grid grid-cols-2 gap-4`]}>
        <div css={[tw`flex items-center`]}>
          <div
            draggable
            onDragStart={(event: React.DragEvent<HTMLDivElement>) =>
              handleDragStart(event, { id: "2", type: "player" })
            }
            css={[tw`w-4 h-4 rounded-full bg-primaryContainer cursor-grab`]}
          />
          <p css={[tw`ml-2`]}>Player</p>
        </div>
        <div css={[tw`flex items-center`]}>
          <div
            draggable
            onDragStart={(event: React.DragEvent<HTMLDivElement>) =>
              handleDragStart(event, { id: "3", type: "enemy" })
            }
            css={[tw`w-4 h-4 rounded-full bg-errorContainer cursor-grab`]}
          />
          <p css={[tw`ml-2`]}>Enemy</p>
        </div>
        <div css={[tw`flex items-center`]}>
          <div
            draggable
            onDragStart={(event: React.DragEvent<HTMLDivElement>) =>
              handleDragStart(event, { id: "4", type: "npc" })
            }
            css={[tw`w-4 h-4 rounded-full bg-tertiaryContainer cursor-grab`]}
          />
          <p css={[tw`ml-2`]}>NPC</p>
        </div>
        <div css={[tw`flex items-center`]}>
          <div
            draggable
            onDragStart={(event: React.DragEvent<HTMLDivElement>) =>
              handleDragStart(event, { id: "5", type: "item" })
            }
            css={[tw`w-4 h-4 rounded-full bg-secondaryContainer cursor-grab`]}
          />
          <p css={[tw`ml-2`]}>Item</p>
        </div>
      </section>
    </article>
  )
}

export default NewTokenPanel
