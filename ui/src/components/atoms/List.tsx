import tw from "twin.macro"
import BodyLarge from "./BodyLarge"
import BodyMedium from "./BodyMedium"

export const List = ({ children, ...props }: { children: React.ReactNode }) => {
  return (
    <ul css={[tw`flex flex-col w-full`]} {...props}>
      {children}
    </ul>
  )
}

type ListItemProps = {
  image: string
  title: string
  description: string
}

export const ListItem = ({
  image,
  title,
  description,
  ...props
}: ListItemProps) => {
  return (
    <li
      css={[
        tw`grid grid-cols-[min-content_1fr] grid-rows-2 gap-x-4 w-full`,
      ]}
      {...props}
    >
      <Image
        image={image}
        css={[tw`col-start-1 col-end-2 row-start-1 row-end-3`]}
      />
      <BodyLarge css={[tw`col-start-2 col-end-3 row-start-1 row-end-2`]}>
        {title}
      </BodyLarge>
      <BodyMedium css={[tw`col-start-2 col-end-3 row-start-2 row-end-3`]}>
        {description}
      </BodyMedium>
    </li>
  )
}

const Image = ({ image, ...props }: { image: string }) => {
  const hasImage = image !== "placeholder"

  if (hasImage) return <img src={image} alt="Game Image" />

  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    >
      <rect width="56" height="56" fill="url(#pattern0)" />
      <defs>
        <pattern
          id="pattern0"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use xlinkHref="#image0_54570_15336" transform="scale(0.005)" />
        </pattern>
        <image
          id="image0_54570_15336"
          width="200"
          height="200"
          xlinkHref="data:image/png;base64,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"
        />
      </defs>
    </svg>
  )
}
