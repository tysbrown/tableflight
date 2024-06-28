import { createContext, useEffect, useReducer } from 'react'
import { GridType, TokenType, type Canvas } from '~common'

export type GridState = {
  grid: GridType
  gameSessionId?: string | null
  rows: number
  cols: number
  cellSize: number
  dimensions: { width: number; height: number }
  backgroundImage: string | null
  lineWidth: number
  zoomLevel: number
  mode: 'draw' | 'pan'
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

export type AddTokenAction = {
  type: 'ADD_TOKEN'
  x: number
  y: number
  token: TokenType
}

export type RemoveTokenAction = {
  type: 'REMOVE_TOKEN'
  x: number
  y: number
}
export type SetBackgroundAction = {
  type: 'SET_BACKGROUND'
  backgroundImage: string
}

export type SetDimensionsAction = {
  type: 'SET_DIMENSIONS'
  dimensions: { width: number; height: number }
}

export type SetCellSizeAction = {
  type: 'SET_CELL_SIZE'
  cellSize: number
}

export type SetZoomLevelAction = {
  type: 'SET_ZOOM_LEVEL'
  zoomLevel: number
}

export type SetGameSessionIdAction = {
  type: 'SET_GAME_SESSION_ID'
  gameSessionId: string
}

export type SetModeAction = {
  type: 'SET_MODE'
  mode: 'draw' | 'pan'
}

export type SetCanvasAction = {
  type: 'SET_CANVAS'
  canvas: Canvas
}

const addToken = (state: GridState, action: AddTokenAction): GridState => {
  const { x, y, token } = action
  const { grid } = state

  const newGrid = grid.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (rowIndex === y && colIndex === x) {
        return token
      }

      return cell
    }),
  )

  return {
    ...state,
    grid: newGrid,
  }
}

const removeToken = (
  state: GridState,
  action: RemoveTokenAction,
): GridState => {
  const { x, y } = action
  const { grid } = state

  const newGrid = grid.map((row, rowIndex) =>
    row.map((cell, colIndex) => {
      if (rowIndex === y && colIndex === x) {
        return null
      }

      return cell
    }),
  )

  return {
    ...state,
    grid: newGrid,
  }
}

const setBackground = (
  state: GridState,
  action: SetBackgroundAction,
): GridState => {
  return {
    ...state,
    backgroundImage: action.backgroundImage,
    canvas: {
      lines: [], // TODO: Remove this when canvas is persisted to db
    },
  }
}

const setDimensions = (
  state: GridState,
  action: SetDimensionsAction,
): GridState => {
  return {
    ...state,
    dimensions: action.dimensions,
    rows: Math.ceil(action.dimensions.height / state.cellSize),
    cols: Math.ceil(action.dimensions.width / state.cellSize),
    grid: Array.from({
      length: Math.ceil(action.dimensions.height / state.cellSize),
    }).map(() =>
      Array.from({
        length: Math.ceil(action.dimensions.width / state.cellSize),
      }).fill(null),
    ) as GridType,
  }
}

const setCellSize = (
  state: GridState,
  action: SetCellSizeAction,
): GridState => {
  return {
    ...state,
    cellSize: action.cellSize,
    rows: Math.ceil(state.dimensions.height / action.cellSize),
    cols: Math.ceil(state.dimensions.width / action.cellSize),
  }
}

const setZoomLevel = (
  state: GridState,
  action: SetZoomLevelAction,
): GridState => {
  return {
    ...state,
    zoomLevel: action.zoomLevel,
  }
}

const setGameSessionId = (
  state: GridState,
  action: SetGameSessionIdAction,
): GridState => {
  return {
    ...state,
    gameSessionId: action.gameSessionId,
  }
}

const setMode = (state: GridState, action: SetModeAction): GridState => {
  return {
    ...state,
    mode: action.mode,
  }
}

const setCanvas = (state: GridState, action: SetCanvasAction): GridState => {
  return {
    ...state,
    canvas: action.canvas,
  }
}

const gridReducer = (state: GridState, action: ActionType): GridState => {
  switch (action.type) {
    case 'ADD_TOKEN':
      return addToken(state, action)
    case 'REMOVE_TOKEN':
      return removeToken(state, action)
    case 'SET_BACKGROUND':
      return setBackground(state, action)
    case 'SET_DIMENSIONS':
      return setDimensions(state, action)
    case 'SET_CELL_SIZE':
      return setCellSize(state, action)
    case 'SET_ZOOM_LEVEL':
      return setZoomLevel(state, action)
    case 'SET_GAME_SESSION_ID':
      return setGameSessionId(state, action)
    case 'SET_MODE':
      return setMode(state, action)
    case 'SET_CANVAS':
      return setCanvas(state, action)
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
  mode: 'pan',
  canvas: {
    lines: [],
  },
}

export const GridStateContext = createContext<GridContextType>({
  state: initialState,
  dispatch: () => initialState,
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
    console.log('GRID STATE changed to: ', state)
  }, [state])

  return (
    <GridStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GridStateContext.Provider>
  )
}
