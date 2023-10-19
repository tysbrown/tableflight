import { createContext, useEffect, useReducer } from "react"
import { GridType, TokenType } from "@/types"

export type GridState = {
  grid: GridType
  rows: number
  cols: number
  cellSize: number
  dimensions: { width: number; height: number }
  backgroundImage: string | null
  lineWidth: number
  zoomLevel: number
}

type ActionType =
  | {
      type: "ADD_TOKEN"
      x: number
      y: number
      token: TokenType
    }
  | { type: "REMOVE_TOKEN"; x: number; y: number }
  | { type: "SET_BACKGROUND"; backgroundImage: string }
  | {
      type: "SET_DIMENSIONS"
      dimensions: { width: number; height: number }
    }
  | { type: "SET_CELL_SIZE"; cellSize: number }
  | { type: "SET_ZOOM_LEVEL"; zoomLevel: number }

const gridReducer = (state: GridState, action: ActionType): GridState => {
  switch (action.type) {
    case "ADD_TOKEN": {
      const newGrid = [...state.grid]
      if (!newGrid[action.y]) newGrid[action.y] = Array(state.cols).fill(null)
      newGrid[action.y]![action.x] = action.token

      return {
        ...state,
        grid: newGrid,
      }
    }
    case "REMOVE_TOKEN": {
      const newGrid = [...state.grid]
      newGrid[action.y]![action.x] = null

      return {
        ...state,
        grid: newGrid,
      }
    }
    case "SET_BACKGROUND":
      return {
        ...state,
        backgroundImage: action.backgroundImage,
      }
    case "SET_DIMENSIONS":
      return {
        ...state,
        dimensions: action.dimensions,
        rows: Math.ceil(action.dimensions.height / state.cellSize),
        cols: Math.ceil(action.dimensions.width / state.cellSize),
      }
    case "SET_CELL_SIZE":
      return {
        ...state,
        cellSize: action.cellSize,
        rows: Math.ceil(state.dimensions.height / action.cellSize),
        cols: Math.ceil(state.dimensions.width / action.cellSize),
      }
    case "SET_ZOOM_LEVEL":
      return {
        ...state,
        zoomLevel: action.zoomLevel,
      }
    default:
      return state
  }
}

export type GridContextType = {
  state?: GridState
  dispatch: React.Dispatch<ActionType>
}

const initialState: GridState = {
  grid: [],
  rows: 0,
  cols: 0,
  cellSize: 50,
  dimensions: { width: 0, height: 0 },
  backgroundImage: null,
  lineWidth: 0.5,
  zoomLevel: 1,
}

export const GridStateContext = createContext<GridContextType>({
  state: initialState,
  dispatch: () => {},
})

export const GridStateProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [state, dispatch] = useReducer(gridReducer, initialState)

  /**
   * @todo - Remove this useEffect when finished debugging
   */
  useEffect(() => {
    console.log("GRID STATE changed to: ", state)
  }, [state])

  return (
    <GridStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GridStateContext.Provider>
  )
}
