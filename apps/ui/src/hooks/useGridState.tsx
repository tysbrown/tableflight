import { useContext } from "react"
import { GridStateContext } from "@/contexts"

export const useGridState = () => useContext(GridStateContext)
