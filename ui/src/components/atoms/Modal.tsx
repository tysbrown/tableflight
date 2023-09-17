import React from "react"
import { useDisableScroll } from "../../hooks/useDisableScroll"
import tw from "twin.macro"

type Props = {
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  heading: string
  children: React.ReactNode
}

const Modal = ({
  isOpen,
  setIsOpen,
  heading,
  children,
  ...remainingProps
}: Props) => {
  useDisableScroll(isOpen)

  if (isOpen)
    return (
      <>
        <div
          css={[
            tw`fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 z-[999]`,
          ]}
          onClick={() => setIsOpen(false)}
        />
        <article
          css={[
            tw`absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 w-[500px] shadow-1 bg-surfaceContainer rounded-lg z-[9999]`,
          ]}
          {...remainingProps}
        >
          <section
            css={[tw`grid items-center h-[60px] border-b-gray-300 border-b`]}
          >
            <h2
              css={[
                tw`text-xl font-bold col-start-1 col-end-2 row-start-1 row-end-2 justify-self-center`,
              ]}
            >
              {heading}
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              css={[
                tw`w-9 h-9 mr-4 rounded-full bg-gray-200 col-start-1 col-end-2 row-start-1 row-end-2 justify-self-end flex justify-center items-center`,
              ]}
            >
              <svg
                css={[tw`w-5 h-5 text-gray-500`]}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 8.586L3.707 2.293 2.293 3.707 8.586 10l-6.293 6.293 1.414 1.414L10 11.414l6.293 6.293 1.414-1.414L11.414 10l6.293-6.293-1.414-1.414L10 8.586z"
                />
              </svg>
            </button>
          </section>
          {children}
        </article>
      </>
    )

  return null
}

export default Modal
