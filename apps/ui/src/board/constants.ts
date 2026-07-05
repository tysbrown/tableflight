/**
 * Renderer-side constants. The buffer strides and flags mirror the engine's
 * layout contract in libs/board-engine/src/render_data.rs — change both
 * together. Colors mirror the Tailwind theme (tailwind.config.js).
 */

// tokens buffer: [worldCenterX, worldCenterY, kind, flags] per token
export const TOKEN_STRIDE = 4
export const TOKEN_FLAG_DRAGGING = 1

// lines buffer: [x1, y1, x2, y2, width, flags] per line
export const LINE_STRIDE = 6

// maps buffer: [x, y, width, height] per placed asset
export const MAP_STRIDE = 4
export const LINE_FLAG_HOVERED = 1
export const LINE_FLAG_IN_PROGRESS = 1 << 1
export const LINE_FLAG_STRAIGHT_HINT = 1 << 2

/** Indexed by the engine's token kind: player, enemy, npc, item. */
export const TOKEN_COLORS = [0x3e3c8f, 0x93000a, 0x603c50, 0x464559]

export const WORLD_FILL = 0xffffff
export const GRID_COLOR = 0x808080
export const GRID_LINE_SCREEN_WIDTH = 0.5
export const MAP_PLACEHOLDER_TINT = 0xe5e7eb // gray-200, while the image loads
export const LINE_COLOR = 0x000000
export const LINE_HOVER_COLOR = 0x3b82f6 // blue-500
export const LINE_STRAIGHT_HINT_COLOR = 0x6b7280 // gray-500
export const HANDLE_SCREEN_RADIUS = 4

/** Below this zoom the grid is denser than ~10px and reads as noise. */
export const GRID_MIN_ZOOM = 0.2

export const SELECTION_COLOR = 0x3b82f6 // blue-500
export const SELECTION_STROKE_SCREEN_WIDTH = 1.5
export const SELECTION_HANDLE_FILL = 0xffffff
export const SELECTION_HANDLE_SCREEN_SIZE = 8

export type CameraView = { x: number; y: number; zoom: number }
