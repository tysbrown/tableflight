import React from "react"
import { Global } from "@emotion/react"
import tw, { css, theme, GlobalStyles as BaseStyles } from "twin.macro"
import "../../assets/fonts/fonts.css"

const customStyles = css({
  body: {
    WebkitTapHighlightColor: theme`colors.purple.500`,
    overscrollBehaviorX: "none",
    ...tw`bg-surface text-onSurface font-roboto`,
  },
  html: {
    overscrollBehaviorX: "none",
  },
})

const GlobalStyles = () => (
  <>
    <BaseStyles />
    <Global styles={customStyles} />
  </>
)

export default GlobalStyles
