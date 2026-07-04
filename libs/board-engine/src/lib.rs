//! WebAssembly bindings for the Tableflight game board engine.
//!
//! The engine is *headless*: it owns the board document (maps, tokens,
//! lines, camera) and all interaction logic, but issues no draw calls. The
//! TypeScript side forwards raw input events in and, each frame, pulls
//! compact typed-array buffers out (see [`render_data`]) for the GPU
//! renderer. Board content is exported/imported as a JSON snapshot (see
//! [`Engine::snapshot`]) for database persistence and sharing between
//! players in a game session.

mod board;
mod render_data;
mod state;

use board::{Board, Mode};
use state::{Point, TokenKind};
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
fn start() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
#[derive(Default)]
pub struct Engine {
    board: Board,
}

#[wasm_bindgen]
impl Engine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Engine {
        Engine { board: Board::new() }
    }

    /// Set the viewport size in CSS pixels. (Pixel density is the
    /// renderer's concern, not the engine's.)
    #[wasm_bindgen(js_name = setViewport)]
    pub fn set_viewport(&mut self, width: f64, height: f64) {
        self.board.set_viewport(width, height);
    }

    /// Advance time-based behavior (edge auto-pan while drawing).
    /// `dt_ms` is the time since the previous frame.
    pub fn tick(&mut self, dt_ms: f64) {
        self.board.tick(dt_ms);
    }

    // --- Pointer / keyboard input (screen CSS-pixel coordinates) -----------

    #[wasm_bindgen(js_name = pointerDown)]
    pub fn pointer_down(&mut self, x: f64, y: f64, button: i16) {
        self.board.pointer_down(Point::new(x, y), button);
    }

    #[wasm_bindgen(js_name = pointerMove)]
    pub fn pointer_move(&mut self, x: f64, y: f64) {
        self.board.pointer_move(Point::new(x, y));
    }

    #[wasm_bindgen(js_name = pointerUp)]
    pub fn pointer_up(&mut self, x: f64, y: f64) {
        self.board.pointer_up(Point::new(x, y));
    }

    #[wasm_bindgen(js_name = pointerLeave)]
    pub fn pointer_leave(&mut self) {
        self.board.pointer_leave();
    }

    /// Trackpad/wheel input. `zooming` is true when ctrl/cmd is held.
    pub fn wheel(&mut self, dx: f64, dy: f64, zooming: bool, x: f64, y: f64) {
        self.board.wheel(dx, dy, zooming, Point::new(x, y));
    }

    /// Cancel the in-progress line draw/edit.
    pub fn escape(&mut self) {
        self.board.escape();
    }

    /// While disabled (Shift held), lines can't be hovered or grabbed, so new
    /// lines can be drawn right next to existing ones.
    #[wasm_bindgen(js_name = setHoverEnabled)]
    pub fn set_hover_enabled(&mut self, enabled: bool) {
        self.board.set_hover_enabled(enabled);
    }

    /// CSS cursor for the canvas, e.g. "grab" / "grabbing" / "crosshair".
    #[wasm_bindgen(js_name = cursorStyle)]
    pub fn cursor_style(&self) -> String {
        self.board.cursor_style().to_string()
    }

    // --- Modes and settings -------------------------------------------------

    /// "pan" or "draw".
    pub fn mode(&self) -> String {
        match self.board.mode() {
            Mode::Pan => "pan".to_string(),
            Mode::Draw => "draw".to_string(),
        }
    }

    #[wasm_bindgen(js_name = setMode)]
    pub fn set_mode(&mut self, mode: &str) {
        match mode {
            "pan" => self.board.set_mode(Mode::Pan),
            "draw" => self.board.set_mode(Mode::Draw),
            _ => {}
        }
    }

    #[wasm_bindgen(js_name = cellSize)]
    pub fn cell_size(&self) -> f64 {
        self.board.state.cell_size
    }

    #[wasm_bindgen(js_name = setCellSize)]
    pub fn set_cell_size(&mut self, cell_size: f64) {
        self.board.set_cell_size(cell_size);
    }

    // --- Camera ------------------------------------------------------------

    pub fn zoom(&self) -> f64 {
        self.board.zoom()
    }

    #[wasm_bindgen(js_name = setZoom)]
    pub fn set_zoom(&mut self, zoom: f64) {
        self.board.set_zoom(zoom);
    }

    #[wasm_bindgen(js_name = zoomToFit)]
    pub fn zoom_to_fit(&mut self) {
        self.board.zoom_to_fit();
    }

    // --- Board content -------------------------------------------------------

    /// Place a map image on the world, centered in the current view.
    /// `width`/`height` are the image's natural size in pixels (the renderer
    /// measures the texture). Returns the new map's id.
    #[wasm_bindgen(js_name = addMap)]
    pub fn add_map(&mut self, url: String, width: f64, height: f64) -> String {
        self.board.add_map(url, width, height)
    }

    #[wasm_bindgen(js_name = removeMap)]
    pub fn remove_map(&mut self, id: &str) {
        self.board.remove_map(id);
    }

    /// The placed maps as JSON: `[{id, url, x, y, width, height}]`.
    #[wasm_bindgen(js_name = mapsJson)]
    pub fn maps_json(&self) -> String {
        serde_json::to_string(&self.board.state.maps)
            .expect("maps are always serializable")
    }

    /// Drop a new token (from the token panel) at a screen position.
    /// `kind` is one of "player" | "enemy" | "npc" | "item".
    #[wasm_bindgen(js_name = dropToken)]
    pub fn drop_token(&mut self, x: f64, y: f64, id: String, kind: &str) {
        if let Some(kind) = TokenKind::parse(kind) {
            self.board.drop_token(Point::new(x, y), id, kind);
        }
    }

    // --- Frame data for the renderer ------------------------------------------

    /// Bumped on any visual change — redraw when this moves.
    #[wasm_bindgen(js_name = frameRevision)]
    pub fn frame_revision(&self) -> u32 {
        self.board.frame_revision()
    }

    /// Bumped when entities are added/removed — rebuild display objects
    /// (token sprites, map sprites) when this moves.
    #[wasm_bindgen(js_name = structureRevision)]
    pub fn structure_revision(&self) -> u32 {
        self.board.structure_revision()
    }

    /// Bumped on camera motion (pan/zoom/viewport) — update the world
    /// transform and grid when this moves.
    #[wasm_bindgen(js_name = cameraRevision)]
    pub fn camera_revision(&self) -> u32 {
        self.board.camera_revision()
    }

    /// `[x, y, zoom]`.
    #[wasm_bindgen(js_name = cameraBuffer)]
    pub fn camera_buffer(&self) -> Vec<f64> {
        render_data::camera(&self.board)
    }

    /// Per token: `[worldCenterX, worldCenterY, kind, flags]`.
    /// kind: 0=player 1=enemy 2=npc 3=item; flags bit0 = dragging.
    #[wasm_bindgen(js_name = tokensBuffer)]
    pub fn tokens_buffer(&self) -> Vec<f32> {
        render_data::tokens(&self.board)
    }

    /// Token ids parallel to `tokensBuffer` — fetch on structure change only.
    #[wasm_bindgen(js_name = tokenIdsJson)]
    pub fn token_ids_json(&self) -> String {
        let ids: Vec<&str> =
            self.board.state.tokens.iter().map(|t| t.id.as_str()).collect();
        serde_json::to_string(&ids).expect("ids are always serializable")
    }

    /// Per line: `[x1, y1, x2, y2, width, flags]`.
    /// flags: bit0 hovered, bit1 in-progress, bit2 straight-hint. The
    /// in-progress line, when present, is the last entry.
    #[wasm_bindgen(js_name = linesBuffer)]
    pub fn lines_buffer(&self) -> Vec<f32> {
        render_data::lines(&self.board)
    }

    // --- Persistence ----------------------------------------------------------

    /// Bumped on every change worth persisting. Poll this to know when to save.
    pub fn revision(&self) -> f64 {
        self.board.revision() as f64
    }

    /// The full board state as JSON — what gets stored in the database and
    /// sent to other players.
    pub fn snapshot(&self) -> String {
        self.board.snapshot()
    }

    #[wasm_bindgen(js_name = loadSnapshot)]
    pub fn load_snapshot(&mut self, json: &str) -> Result<(), JsValue> {
        self.board
            .load_snapshot(json)
            .map_err(|e| JsValue::from_str(&format!("invalid board snapshot: {e}")))
    }
}
