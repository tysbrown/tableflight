import { createContext } from "react"

type ClientState = {
  resetClient: () => void
}

export const ClientContext = createContext<ClientState>({
  resetClient: () => {},
})
