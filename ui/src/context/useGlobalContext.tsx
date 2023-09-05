import { useContext } from "react"
import { GlobalStateContext } from "./GlobalStateContext"

export const useGlobalStateContext = () => useContext(GlobalStateContext)
