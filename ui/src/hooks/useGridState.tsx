import { useContext } from "react"
import { GridStateContext } from "@/contexts/GridStateProvider"

export const useGridState = () => useContext(GridStateContext)
