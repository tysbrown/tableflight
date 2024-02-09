import { createContext, useEffect, useReducer } from "react"
import { GridType, TokenType, Canvas } from "@/types"

export type GridState = {
  grid: GridType
  gameSessionId?: number | null
  rows: number
  cols: number
  cellSize: number
  dimensions: { width: number; height: number }
  backgroundImage: string | null
  lineWidth: number
  zoomLevel: number
  mode: "draw" | "pan" | "edit"
  canvas: Canvas
}

type ActionType =
  | AddTokenAction
  | RemoveTokenAction
  | SetBackgroundAction
  | SetDimensionsAction
  | SetCellSizeAction
  | SetZoomLevelAction
  | SetGameSessionIdAction
  | SetModeAction
  | SetCanvasAction

type AddTokenAction = {
  type: "ADD_TOKEN"
  x: number
  y: number
  token: TokenType
}

type RemoveTokenAction = {
  type: "REMOVE_TOKEN"
  x: number
  y: number
}

type SetBackgroundAction = {
  type: "SET_BACKGROUND"
  backgroundImage: string
}

type SetDimensionsAction = {
  type: "SET_DIMENSIONS"
  dimensions: { width: number; height: number }
}

type SetCellSizeAction = {
  type: "SET_CELL_SIZE"
  cellSize: number
}

type SetZoomLevelAction = {
  type: "SET_ZOOM_LEVEL"
  zoomLevel: number
}

type SetGameSessionIdAction = {
  type: "SET_GAME_SESSION_ID"
  gameSessionId: number
}

type SetModeAction = {
  type: "SET_MODE"
  mode: "draw" | "pan" | "edit"
}

type SetCanvasAction = {
  type: "SET_CANVAS"
  canvas: Canvas
}

const gridReducer = (state: GridState, action: ActionType): GridState => {
  switch (action.type) {
    case "ADD_TOKEN": {
      const newGrid = [...state.grid]
      if (!newGrid[action.y])
        newGrid[action.y] = Array(state.cols).fill(null) as GridType[number]
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
        canvas: {
          lines: [], // TODO: Remove this when canvas is persisted to db
        },
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
    case "SET_GAME_SESSION_ID":
      return {
        ...state,
        gameSessionId: action.gameSessionId,
      }
    case "SET_MODE":
      return {
        ...state,
        mode: action.mode,
      }
    case "SET_CANVAS":
      return {
        ...state,
        canvas: action.canvas,
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
  gameSessionId: null,
  mode: "pan",
  canvas: {
    lines: [],
  },
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
