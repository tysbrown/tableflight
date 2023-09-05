import { createContext, useEffect, useState } from "react"
import { User } from "@/types"

type UserState = {
  accessToken?: string
  user?: Partial<User>
  isLoggedIn: boolean
}

type GlobalContextType = {
  state?: UserState
  setState: React.Dispatch<React.SetStateAction<UserState>>
}

export const GlobalStateContext = createContext<GlobalContextType>({
  state: {
    isLoggedIn: false,
  },
  setState: () => {},
})

export const GlobalStateProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [state, setState] = useState({ isLoggedIn: false })

  /**
    * @todo - Remove this useFfect when finished debugging
   */
  useEffect(() => {
    console.log("Global state changed to: ", state)
  }, [state])

  return (
    <GlobalStateContext.Provider value={{ state, setState }}>
      {children}
    </GlobalStateContext.Provider>
  )
}
