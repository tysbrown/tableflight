import { useContext } from "react"
import { GlobalStateContext } from "../contexts/GlobalStateProvider"

export const useGlobalState = () => useContext(GlobalStateContext)
