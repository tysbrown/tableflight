import { useContext } from "react"
import { GlobalStateContext } from "../context/GlobalStateProvider"

export const useGlobalState = () => useContext(GlobalStateContext)
