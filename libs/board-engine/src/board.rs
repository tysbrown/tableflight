//! Pure board logic: camera, pointer interactions, hit-testing, and state
//! mutations. No DOM or rendering here, so everything is unit-testable with
//! plain `cargo test`.
//!
//! Coordinate systems:
//! - *Screen* coordinates are CSS pixels relative to the canvas top-left.
//! - *World* coordinates are board pixels; `screen = world * zoom + camera`.

use crate::state::{
    BoardState, Line, MapImage, Point, Token, TokenKind, MAX_ZOOM, MIN_ZOOM,
    WORLD_HALF_EXTENT,
};

/// Screen-pixel radius for hovering/grabbing lines and their handles.
const HOVER_THRESHOLD: f64 = 10.0;

/// Pointer-up within this many screen pixels of pointer-down counts as a click.
const CLICK_SLOP: f64 = 3.0;

/// Lines within this world-pixel tolerance of horizontal/vertical are shown
/// with the "straight line" hint color while drawing.
const STRAIGHT_TOLERANCE: f64 = 0.5;

/// Auto-pan (while drawing near a viewport edge) kicks in within this many
/// screen pixels of the edge and tops out at this speed.
const AUTOPAN_EDGE: f64 = 50.0;
const AUTOPAN_MAX_SPEED: f64 = 600.0; // screen px / second

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Mode {
    Pan,
    Draw,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LineEnd {
    Start,
    End,
}

#[derive(Debug)]
enum Drag {
    None,
    /// Panning the camera; `last` is the previous pointer position (screen).
    Pan { last: Point },
    /// Dragging the token at `tokens[index]`; `at` is the cursor in world coords.
    Token { index: usize, at: Point },
}

/// A line being drawn or edited. It is not part of `BoardState.lines` until
/// committed by a second click.
#[derive(Debug)]
pub struct DrawInProgress {
    pub line: Line,
    /// `None` when drawing a new line; otherwise which endpoint of an
    /// existing line is being moved.
    pub editing: Option<LineEnd>,
    /// The untouched line to restore if the edit is cancelled with Escape.
    original: Option<Line>,
}

pub struct Board {
    pub state: BoardState,
    viewport: (f64, f64),
    mode: Mode,
    drag: Drag,
    draw: Option<DrawInProgress>,
    hovered_line: Option<String>,
    hover_enabled: bool,
    /// Last known pointer position in screen coordinates.
    cursor: Option<Point>,
    pointer_down: Option<Point>,
    dragged_since_down: bool,
    /// Bumped on any visual change (camera, hover, drag ghosts) — the
    /// renderer redraws when this moves.
    frame_rev: u32,
    /// Bumped when entity membership changes (token/map/line added or
    /// removed) — the renderer rebuilds its display objects when this moves.
    structure_rev: u32,
    /// Bumped on camera motion (pan/zoom/viewport) — the renderer updates
    /// its world transform and grid without rebuilding content.
    camera_rev: u32,
    revision: u64,
}

impl Default for Board {
    fn default() -> Self {
        Self::new()
    }
}

impl Board {
    pub fn new() -> Self {
        Self {
            state: BoardState::default(),
            viewport: (0.0, 0.0),
            mode: Mode::Pan,
            drag: Drag::None,
            draw: None,
            hovered_line: None,
            hover_enabled: true,
            cursor: None,
            pointer_down: None,
            dragged_since_down: false,
            frame_rev: 1,
            structure_rev: 1,
            camera_rev: 1,
            revision: 0,
        }
    }

    // --- View -------------------------------------------------------------

    pub fn set_viewport(&mut self, width: f64, height: f64) {
        self.viewport = (width, height);
        self.clamp_camera();
        self.mark_camera();
    }

    pub fn zoom(&self) -> f64 {
        self.state.camera.zoom
    }

    pub fn to_world(&self, screen: Point) -> Point {
        let cam = self.state.camera;
        Point::new((screen.x - cam.x) / cam.zoom, (screen.y - cam.y) / cam.zoom)
    }

    /// Pan by a screen-space delta (the content follows the cursor).
    pub fn pan_by(&mut self, dx: f64, dy: f64) {
        self.state.camera.x += dx;
        self.state.camera.y += dy;
        self.clamp_camera();
        self.mark_camera();
    }

    /// Zoom keeping the world point under `anchor` (screen coords) fixed.
    pub fn zoom_at(&mut self, anchor: Point, zoom: f64) {
        let zoom = zoom.clamp(MIN_ZOOM, MAX_ZOOM);
        let cam = &mut self.state.camera;
        let scale = zoom / cam.zoom;

        cam.x = anchor.x - (anchor.x - cam.x) * scale;
        cam.y = anchor.y - (anchor.y - cam.y) * scale;
        cam.zoom = zoom;

        self.clamp_camera();
        self.mark_camera();
    }

    /// Zoom centered on the middle of the viewport.
    pub fn set_zoom(&mut self, zoom: f64) {
        let center = Point::new(self.viewport.0 / 2.0, self.viewport.1 / 2.0);
        self.zoom_at(center, zoom);
    }

    /// Fit the view to the content on the board (maps, tokens, lines), or to
    /// a default region around the origin when the board is empty.
    pub fn zoom_to_fit(&mut self) {
        let (vw, vh) = self.viewport;
        if vw <= 0.0 || vh <= 0.0 {
            return;
        }

        // An empty board frames a default region centered on the origin.
        let (min, max) = self
            .content_bounds()
            .unwrap_or((Point::new(-1500.0, -1500.0), Point::new(1500.0, 1500.0)));
        // Degenerate spans (a single axis-aligned line, one point) still
        // get framed rather than silently ignoring the request.
        let w = (max.x - min.x).max(1.0);
        let h = (max.y - min.y).max(1.0);

        let zoom = (vw / w).min(vh / h).clamp(MIN_ZOOM, MAX_ZOOM);
        let center = Point::new((min.x + max.x) / 2.0, (min.y + max.y) / 2.0);
        let cam = &mut self.state.camera;
        cam.zoom = zoom;
        cam.x = vw / 2.0 - center.x * zoom;
        cam.y = vh / 2.0 - center.y * zoom;

        self.clamp_camera();
        self.mark_camera();
    }

    /// World-space bounding box of everything placed on the board, or None
    /// when the board is empty.
    fn content_bounds(&self) -> Option<(Point, Point)> {
        let cell = self.state.cell_size;
        let mut min = Point::new(f64::INFINITY, f64::INFINITY);
        let mut max = Point::new(f64::NEG_INFINITY, f64::NEG_INFINITY);
        let mut include = |x: f64, y: f64| {
            min.x = min.x.min(x);
            min.y = min.y.min(y);
            max.x = max.x.max(x);
            max.y = max.y.max(y);
        };

        for map in &self.state.maps {
            include(map.x, map.y);
            include(map.x + map.width, map.y + map.height);
        }
        for token in &self.state.tokens {
            include(token.col as f64 * cell, token.row as f64 * cell);
            include((token.col + 1) as f64 * cell, (token.row + 1) as f64 * cell);
        }
        for line in &self.state.lines {
            include(line.start.x, line.start.y);
            include(line.end.x, line.end.y);
        }

        if min.x > max.x {
            None
        } else {
            Some((min, max))
        }
    }

    /// Overscroll scrollbar geometry, `[hStart, hSize, vStart, vSize]` as
    /// fractions of each track. The scroll range is the union of the content
    /// bounds and the viewport, so panning away from the content grows the
    /// range and shrinks the thumb. A size of 1.0 means everything on that
    /// axis is in view (hide the bar); an empty board has no scrollbars.
    pub fn scrollbar_metrics(&self) -> [f64; 4] {
        let (vw, vh) = self.viewport;
        let (Some((min, max)), true) = (self.content_bounds(), vw > 0.0 && vh > 0.0)
        else {
            return [0.0, 1.0, 0.0, 1.0];
        };

        let cam = self.state.camera;
        let sx0 = min.x * cam.zoom + cam.x;
        let sx1 = max.x * cam.zoom + cam.x;
        let sy0 = min.y * cam.zoom + cam.y;
        let sy1 = max.y * cam.zoom + cam.y;

        // One axis: the content span in screen space vs the viewport [0, view].
        let fractions = |content_start: f64, content_end: f64, view: f64| {
            let range_start = content_start.min(0.0);
            let range_len = content_end.max(view) - range_start;
            [-range_start / range_len, view / range_len]
        };
        let [h_start, h_size] = fractions(sx0, sx1, vw);
        let [v_start, v_size] = fractions(sy0, sy1, vh);
        [h_start, h_size, v_start, v_size]
    }

    /// The world is open: the camera roams freely, clamped only so its
    /// *center* stays within ±[`WORLD_HALF_EXTENT`]. One continuous board —
    /// map images are placed objects, not boundaries.
    fn clamp_camera(&mut self) {
        let (vw, vh) = self.viewport;
        let cam = &mut self.state.camera;

        let center_x = (vw / 2.0 - cam.x) / cam.zoom;
        let center_y = (vh / 2.0 - cam.y) / cam.zoom;

        cam.x = vw / 2.0 - center_x.clamp(-WORLD_HALF_EXTENT, WORLD_HALF_EXTENT) * cam.zoom;
        cam.y = vh / 2.0 - center_y.clamp(-WORLD_HALF_EXTENT, WORLD_HALF_EXTENT) * cam.zoom;
    }

    // --- Modes and settings -------------------------------------------------

    pub fn mode(&self) -> Mode {
        self.mode
    }

    pub fn set_mode(&mut self, mode: Mode) {
        self.cancel_draw();
        self.hovered_line = None;
        self.drag = Drag::None;
        self.mode = mode;
        self.mark_frame();
    }

    pub fn set_cell_size(&mut self, cell_size: f64) {
        self.state.cell_size = cell_size.max(1.0);
        self.bump_revision();
    }

    /// Place a map image on the world, centered in the current view. Nothing
    /// else changes — maps are content, not board configuration.
    pub fn add_map(&mut self, url: String, width: f64, height: f64) -> String {
        let (vw, vh) = self.viewport;
        let center = self.to_world(Point::new(vw / 2.0, vh / 2.0));

        let id = self.state.mint_id("map");
        self.state.maps.push(MapImage {
            id: id.clone(),
            url,
            x: center.x - width / 2.0,
            y: center.y - height / 2.0,
            width,
            height,
        });
        self.mark_structure();
        self.bump_revision();
        id
    }

    pub fn remove_map(&mut self, id: &str) {
        let before = self.state.maps.len();
        self.state.maps.retain(|map| map.id != id);
        if self.state.maps.len() != before {
            self.mark_structure();
            self.bump_revision();
        }
    }

    pub fn set_hover_enabled(&mut self, enabled: bool) {
        self.hover_enabled = enabled;
        if !enabled {
            self.hovered_line = None;
        }
        self.mark_frame();
    }

    // --- Tokens -------------------------------------------------------------

    pub fn cell_at(&self, world: Point) -> (i32, i32) {
        (
            (world.x / self.state.cell_size).floor() as i32,
            (world.y / self.state.cell_size).floor() as i32,
        )
    }

    fn token_index_at(&self, world: Point) -> Option<usize> {
        let cell = self.cell_at(world);
        self.state
            .tokens
            .iter()
            .position(|t| (t.col, t.row) == cell)
    }

    /// Place a token on a cell, replacing any occupant.
    fn place_token(&mut self, id: String, kind: TokenKind, (col, row): (i32, i32)) {
        self.state.tokens.retain(|t| (t.col, t.row) != (col, row));
        self.state.tokens.push(Token { id, kind, col, row });
        self.mark_structure();
        self.bump_revision();
    }

    /// Drop a brand-new token (from the token panel) at a screen position.
    pub fn drop_token(&mut self, screen: Point, id: String, kind: TokenKind) {
        let cell = self.cell_at(self.to_world(screen));
        self.place_token(id, kind, cell);
    }

    /// The token currently being dragged, if any: `(index, cursor world pos)`.
    pub fn dragged_token(&self) -> Option<(usize, Point)> {
        match self.drag {
            Drag::Token { index, at } => Some((index, at)),
            _ => None,
        }
    }

    // --- Pointer events -------------------------------------------------------

    pub fn pointer_down(&mut self, screen: Point, button: i16) {
        if button != 0 {
            return;
        }
        self.pointer_down = Some(screen);
        self.dragged_since_down = false;

        if self.mode == Mode::Pan {
            let world = self.to_world(screen);
            self.drag = match self.token_index_at(world) {
                Some(index) => Drag::Token { index, at: world },
                None => Drag::Pan { last: screen },
            };
            self.mark_frame();
        }
    }

    pub fn pointer_move(&mut self, screen: Point) {
        self.cursor = Some(screen);

        if let Some(down) = self.pointer_down {
            if down.distance_to(screen) > CLICK_SLOP {
                self.dragged_since_down = true;
            }
        }

        match &mut self.drag {
            Drag::Pan { last } => {
                let (dx, dy) = (screen.x - last.x, screen.y - last.y);
                *last = screen;
                self.pan_by(dx, dy);
            }
            Drag::Token { .. } => {
                let world = self.to_world(screen);
                if let Drag::Token { at, .. } = &mut self.drag {
                    *at = world;
                }
                self.mark_frame();
            }
            Drag::None => {
                if self.mode == Mode::Draw {
                    let world = self.to_world(screen);
                    if self.draw.is_some() {
                        self.move_draw_endpoint(world);
                    } else {
                        self.scan_hover(world);
                    }
                }
            }
        }
    }

    pub fn pointer_up(&mut self, screen: Point) {
        let was_click = self.pointer_down.is_some() && !self.dragged_since_down;
        self.pointer_down = None;
        self.dragged_since_down = false;

        match std::mem::replace(&mut self.drag, Drag::None) {
            Drag::Token { index, at } => {
                let cell = self.cell_at(at);
                let token = &self.state.tokens[index];
                if (token.col, token.row) != cell {
                    let Token { id, kind, .. } = self.state.tokens.remove(index);
                    self.place_token(id, kind, cell);
                }
                self.mark_frame();
            }
            Drag::Pan { .. } => self.mark_frame(),
            Drag::None => {
                if self.mode == Mode::Draw && was_click {
                    self.handle_draw_click(self.to_world(screen));
                }
            }
        }
    }

    pub fn pointer_leave(&mut self) {
        self.cursor = None;
        if matches!(self.drag, Drag::Pan { .. }) {
            self.drag = Drag::None;
        }
    }

    pub fn wheel(&mut self, dx: f64, dy: f64, zooming: bool, anchor: Point) {
        if zooming {
            self.zoom_at(anchor, self.zoom() - dy * 0.01);
        } else {
            self.pan_by(-dx, -dy);
        }
    }

    /// Cancel the in-progress draw/edit (Escape).
    pub fn escape(&mut self) {
        self.cancel_draw();
    }

    fn cancel_draw(&mut self) {
        if let Some(draw) = self.draw.take() {
            if let Some(original) = draw.original {
                self.state.lines.push(original);
            }
            self.mark_structure();
        }
    }

    // --- Drawing ---------------------------------------------------------------

    pub fn draw_in_progress(&self) -> Option<&DrawInProgress> {
        self.draw.as_ref()
    }

    pub fn hovered_line(&self) -> Option<&str> {
        self.hovered_line.as_deref()
    }

    /// Whether a line is horizontal or vertical (used for the draw hint color).
    pub fn is_straight(line: &Line) -> bool {
        (line.start.x - line.end.x).abs() < STRAIGHT_TOLERANCE
            || (line.start.y - line.end.y).abs() < STRAIGHT_TOLERANCE
    }

    fn move_draw_endpoint(&mut self, world: Point) {
        if let Some(draw) = &mut self.draw {
            match draw.editing {
                Some(LineEnd::Start) => draw.line.start = world,
                _ => draw.line.end = world,
            }
            self.mark_frame();
        }
    }

    /// First click starts a line (or picks up a handle); second click commits.
    fn handle_draw_click(&mut self, world: Point) {
        match self.draw.take() {
            Some(mut draw) => {
                if draw.line.id.is_empty() {
                    draw.line.id = self.state.mint_id("line");
                }
                self.state.lines.push(draw.line);
                self.mark_structure();
                self.bump_revision();
            }
            None => {
                if let Some((index, end)) = self.handle_hit(world) {
                    let original = self.state.lines.remove(index);
                    self.hovered_line = None;
                    self.mark_structure();
                    self.draw = Some(DrawInProgress {
                        line: original.clone(),
                        editing: Some(end),
                        original: Some(original),
                    });
                } else {
                    self.draw = Some(DrawInProgress {
                        line: Line {
                            id: String::new(),
                            start: world,
                            end: world,
                            width: 2.0,
                        },
                        editing: None,
                        original: None,
                    });
                }
                self.mark_frame();
            }
        }
    }

    // --- Hit-testing ---------------------------------------------------------

    fn hover_threshold(&self) -> f64 {
        HOVER_THRESHOLD / self.zoom()
    }

    /// Find a line endpoint (handle) near a world point. The currently
    /// hovered line's handles win over other lines' so grabbing feels stable
    /// when handles overlap.
    fn handle_hit(&self, world: Point) -> Option<(usize, LineEnd)> {
        if !self.hover_enabled {
            return None;
        }
        let threshold = self.hover_threshold();
        let mut nearest: Option<(f64, usize, LineEnd)> = None;

        for (index, line) in self.state.lines.iter().enumerate() {
            for (point, end) in [(line.start, LineEnd::Start), (line.end, LineEnd::End)] {
                let distance = world.distance_to(point);
                if distance > threshold {
                    continue;
                }
                if self.hovered_line.as_deref() == Some(&line.id) {
                    return Some((index, end));
                }
                if nearest.is_none_or(|(best, ..)| distance < best) {
                    nearest = Some((distance, index, end));
                }
            }
        }
        nearest.map(|(_, index, end)| (index, end))
    }

    /// Update `hovered_line`: handles take priority over line bodies, and the
    /// nearest match wins.
    fn scan_hover(&mut self, world: Point) {
        if !self.hover_enabled {
            return;
        }

        let hovered = match self.handle_hit(world) {
            Some((index, _)) => Some(self.state.lines[index].id.clone()),
            None => {
                let threshold = self.hover_threshold();
                self.state
                    .lines
                    .iter()
                    .map(|line| (distance_to_segment(world, line.start, line.end), line))
                    .filter(|(distance, _)| *distance <= threshold)
                    .min_by(|(a, _), (b, _)| a.total_cmp(b))
                    .map(|(_, line)| line.id.clone())
            }
        };

        if hovered != self.hovered_line {
            self.hovered_line = hovered;
            self.mark_frame();
        }
    }

    // --- Auto-pan ---------------------------------------------------------------

    /// Advance time-based behavior. Currently: pan the view when drawing near
    /// a viewport edge, keeping the line endpoint pinned under the cursor.
    pub fn tick(&mut self, dt_ms: f64) {
        if self.draw.is_none() {
            return;
        }
        let Some(cursor) = self.cursor else { return };
        let (vw, vh) = self.viewport;

        // 0..1 per axis: how deep the cursor is into the edge zone.
        let strength = |distance_from_edge: f64| {
            ((AUTOPAN_EDGE - distance_from_edge) / AUTOPAN_EDGE).clamp(0.0, 1.0)
        };
        let dx = strength(cursor.x) - strength(vw - cursor.x);
        let dy = strength(cursor.y) - strength(vh - cursor.y);

        if dx == 0.0 && dy == 0.0 {
            return;
        }

        let step = AUTOPAN_MAX_SPEED * (dt_ms / 1000.0);
        self.pan_by(dx * step, dy * step);
        self.move_draw_endpoint(self.to_world(cursor));
    }

    // --- Bookkeeping ---------------------------------------------------------

    pub fn cursor_style(&self) -> &'static str {
        match (&self.drag, self.mode) {
            (Drag::Pan { .. } | Drag::Token { .. }, _) => "grabbing",
            (_, Mode::Pan) => "grab",
            (_, Mode::Draw) => {
                let over_handle = self.draw.is_none()
                    && self
                        .cursor
                        .is_some_and(|c| self.handle_hit(self.to_world(c)).is_some());
                if over_handle {
                    "move"
                } else {
                    "crosshair"
                }
            }
        }
    }

    /// Bumped on every change worth persisting (not camera moves or hovers).
    pub fn revision(&self) -> u64 {
        self.revision
    }

    fn bump_revision(&mut self) {
        self.revision += 1;
        self.mark_frame();
    }

    pub fn frame_revision(&self) -> u32 {
        self.frame_rev
    }

    pub fn structure_revision(&self) -> u32 {
        self.structure_rev
    }

    pub fn camera_revision(&self) -> u32 {
        self.camera_rev
    }

    fn mark_camera(&mut self) {
        self.camera_rev = self.camera_rev.wrapping_add(1);
    }

    fn mark_frame(&mut self) {
        self.frame_rev = self.frame_rev.wrapping_add(1);
    }

    fn mark_structure(&mut self) {
        self.structure_rev = self.structure_rev.wrapping_add(1);
        self.mark_frame();
    }

    // --- Persistence ---------------------------------------------------------

    pub fn snapshot(&self) -> String {
        // A line whose endpoint is being edited is temporarily out of
        // `state.lines`; persist its original so a save that happens
        // mid-edit (autosave, tab close) can never lose it.
        match self.draw.as_ref().and_then(|draw| draw.original.as_ref()) {
            Some(original) => {
                let mut state = self.state.clone();
                state.lines.push(original.clone());
                state.to_json()
            }
            None => self.state.to_json(),
        }
    }

    pub fn load_snapshot(&mut self, json: &str) -> Result<(), serde_json::Error> {
        let mut state = BoardState::from_json(json)?;
        // Both are divisors — never trust a snapshot to keep the invariants.
        state.camera.zoom = state.camera.zoom.clamp(MIN_ZOOM, MAX_ZOOM);
        state.cell_size = state.cell_size.max(1.0);

        self.state = state;
        self.draw = None;
        self.hovered_line = None;
        self.drag = Drag::None;
        self.clamp_camera();
        self.mark_structure();
        self.mark_camera();
        Ok(())
    }
}

/// Distance from a point to a line segment.
fn distance_to_segment(p: Point, a: Point, b: Point) -> f64 {
    let length_squared = (b.x - a.x).powi(2) + (b.y - a.y).powi(2);
    if length_squared == 0.0 {
        return p.distance_to(a);
    }

    // Project p onto the segment, clamping to its ends.
    let t = (((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / length_squared)
        .clamp(0.0, 1.0);
    let closest = Point::new(a.x + t * (b.x - a.x), a.y + t * (b.y - a.y));
    p.distance_to(closest)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn board() -> Board {
        let mut board = Board::new();
        board.set_viewport(1000.0, 800.0);
        board
    }

    #[test]
    fn camera_roams_freely_within_the_world_extent() {
        let mut b = board();
        b.pan_by(50_000.0, -70_000.0); // far into open space — no board edges
        assert_eq!((b.state.camera.x, b.state.camera.y), (50_000.0, -70_000.0));
    }

    #[test]
    fn camera_center_is_clamped_to_the_world_extent() {
        let mut b = board();
        b.pan_by(1e9, 1e9); // way past the world edge

        // The camera center may reach, but not pass, -WORLD_HALF_EXTENT.
        let center_x = (1000.0 / 2.0 - b.state.camera.x) / b.zoom();
        let center_y = (800.0 / 2.0 - b.state.camera.y) / b.zoom();
        assert_eq!(center_x, -WORLD_HALF_EXTENT);
        assert_eq!(center_y, -WORLD_HALF_EXTENT);
    }

    #[test]
    fn zoom_is_clamped() {
        let mut b = board();
        b.set_zoom(99.0);
        assert_eq!(b.zoom(), MAX_ZOOM);
        b.set_zoom(0.0);
        assert_eq!(b.zoom(), MIN_ZOOM);
    }

    #[test]
    fn zoom_at_keeps_the_anchor_point_fixed() {
        let mut b = board();
        b.pan_by(-500.0, -300.0);
        let anchor = Point::new(400.0, 300.0);
        let before = b.to_world(anchor);

        b.zoom_at(anchor, 2.0);
        let after = b.to_world(anchor);

        assert!(before.distance_to(after) < 1e-9);
    }

    #[test]
    fn drag_pans_the_camera() {
        let mut b = board();
        b.pan_by(-100.0, -100.0);
        b.pointer_down(Point::new(500.0, 400.0), 0);
        b.pointer_move(Point::new(520.0, 430.0));
        b.pointer_up(Point::new(520.0, 430.0));
        assert_eq!((b.state.camera.x, b.state.camera.y), (-80.0, -70.0));
    }

    #[test]
    fn dropping_and_moving_a_token() {
        let mut b = board();
        b.drop_token(Point::new(125.0, 75.0), "t1".into(), TokenKind::Player);
        assert_eq!(b.state.tokens.len(), 1);
        assert_eq!((b.state.tokens[0].col, b.state.tokens[0].row), (2, 1));
        let revision = b.revision();

        // Drag the token to a new cell (pan mode).
        b.pointer_down(Point::new(125.0, 75.0), 0);
        b.pointer_move(Point::new(325.0, 275.0));
        b.pointer_up(Point::new(325.0, 275.0));

        assert_eq!((b.state.tokens[0].col, b.state.tokens[0].row), (6, 5));
        assert!(b.revision() > revision);
    }

    #[test]
    fn dropping_a_token_on_an_occupied_cell_replaces_the_occupant() {
        let mut b = board();
        b.drop_token(Point::new(25.0, 25.0), "t1".into(), TokenKind::Player);
        b.drop_token(Point::new(25.0, 25.0), "t2".into(), TokenKind::Enemy);
        assert_eq!(b.state.tokens.len(), 1);
        assert_eq!(b.state.tokens[0].id, "t2");
    }

    #[test]
    fn tokens_can_live_anywhere_in_the_open_world() {
        let mut b = board();
        b.pan_by(-100_000.0, -100_000.0); // roam very far from the origin
        b.drop_token(Point::new(500.0, 400.0), "t1".into(), TokenKind::Player);

        let token = &b.state.tokens[0];
        assert_eq!((token.col, token.row), (2010, 2008)); // (100500/50, 100400/50)

        // Negative world coordinates work the same way.
        let mut b2 = board();
        b2.pan_by(90_000.0, 90_000.0);
        b2.drop_token(Point::new(0.0, 0.0), "t2".into(), TokenKind::Npc);
        assert_eq!(
            (b2.state.tokens[0].col, b2.state.tokens[0].row),
            (-1800, -1800),
        );
    }

    #[test]
    fn click_click_draws_a_line() {
        let mut b = board();
        b.set_mode(Mode::Draw);

        b.pointer_down(Point::new(100.0, 100.0), 0);
        b.pointer_up(Point::new(100.0, 100.0));
        assert!(b.draw_in_progress().is_some());

        b.pointer_move(Point::new(300.0, 250.0));
        b.pointer_down(Point::new(300.0, 250.0), 0);
        b.pointer_up(Point::new(300.0, 250.0));

        assert!(b.draw_in_progress().is_none());
        assert_eq!(b.state.lines.len(), 1);
        let line = &b.state.lines[0];
        assert_eq!(line.id, "line-1");
        assert_eq!(line.start, Point::new(100.0, 100.0));
        assert_eq!(line.end, Point::new(300.0, 250.0));
    }

    #[test]
    fn escape_cancels_a_new_line() {
        let mut b = board();
        b.set_mode(Mode::Draw);
        b.pointer_down(Point::new(100.0, 100.0), 0);
        b.pointer_up(Point::new(100.0, 100.0));

        b.escape();
        assert!(b.draw_in_progress().is_none());
        assert!(b.state.lines.is_empty());
    }

    fn draw_line(b: &mut Board, from: Point, to: Point) {
        b.pointer_down(from, 0);
        b.pointer_up(from);
        b.pointer_move(to);
        b.pointer_down(to, 0);
        b.pointer_up(to);
    }

    #[test]
    fn clicking_a_handle_edits_the_endpoint_and_escape_restores_it() {
        let mut b = board();
        b.set_mode(Mode::Draw);
        draw_line(&mut b, Point::new(100.0, 100.0), Point::new(300.0, 250.0));

        // Hover the line, then click its end handle to pick it up.
        b.pointer_move(Point::new(300.0, 250.0));
        assert_eq!(b.hovered_line(), Some("line-1"));
        b.pointer_down(Point::new(300.0, 250.0), 0);
        b.pointer_up(Point::new(300.0, 250.0));

        let draw = b.draw_in_progress().expect("editing the line");
        assert_eq!(draw.editing, Some(LineEnd::End));
        assert!(b.state.lines.is_empty()); // pulled out while editing

        // Cancel: the original line comes back untouched.
        b.pointer_move(Point::new(500.0, 500.0));
        b.escape();
        assert_eq!(b.state.lines.len(), 1);
        assert_eq!(b.state.lines[0].end, Point::new(300.0, 250.0));
    }

    #[test]
    fn committing_an_edited_endpoint_keeps_the_line_id() {
        let mut b = board();
        b.set_mode(Mode::Draw);
        draw_line(&mut b, Point::new(100.0, 100.0), Point::new(300.0, 250.0));

        b.pointer_move(Point::new(300.0, 250.0));
        b.pointer_down(Point::new(300.0, 250.0), 0);
        b.pointer_up(Point::new(300.0, 250.0));

        b.pointer_move(Point::new(400.0, 400.0));
        b.pointer_down(Point::new(400.0, 400.0), 0);
        b.pointer_up(Point::new(400.0, 400.0));

        assert_eq!(b.state.lines.len(), 1);
        assert_eq!(b.state.lines[0].id, "line-1");
        assert_eq!(b.state.lines[0].end, Point::new(400.0, 400.0));
    }

    #[test]
    fn hover_prefers_handles_over_bodies_and_respects_threshold() {
        let mut b = board();
        b.set_mode(Mode::Draw);
        draw_line(&mut b, Point::new(100.0, 100.0), Point::new(300.0, 100.0));

        b.pointer_move(Point::new(200.0, 105.0)); // near the body
        assert_eq!(b.hovered_line(), Some("line-1"));

        b.pointer_move(Point::new(200.0, 150.0)); // too far away
        assert_eq!(b.hovered_line(), None);

        b.set_hover_enabled(false);
        b.pointer_move(Point::new(200.0, 105.0));
        assert_eq!(b.hovered_line(), None);
    }

    #[test]
    fn straightness_hint() {
        let straight = Line {
            id: "l".into(),
            start: Point::new(0.0, 10.0),
            end: Point::new(100.0, 10.2),
            width: 2.0,
        };
        assert!(Board::is_straight(&straight));

        let slanted = Line {
            id: "l".into(),
            start: Point::new(0.0, 10.0),
            end: Point::new(100.0, 50.0),
            width: 2.0,
        };
        assert!(!Board::is_straight(&slanted));
    }

    #[test]
    fn autopan_moves_the_view_while_drawing_near_an_edge() {
        let mut b = board();
        b.pan_by(-500.0, -300.0);
        b.set_mode(Mode::Draw);
        b.pointer_down(Point::new(500.0, 400.0), 0);
        b.pointer_up(Point::new(500.0, 400.0));

        b.pointer_move(Point::new(990.0, 400.0)); // hug the right edge
        let x_before = b.state.camera.x;
        b.tick(16.0);
        assert!(b.state.camera.x < x_before, "camera pans right");

        // The endpoint stays pinned under the cursor.
        let endpoint = b.draw_in_progress().unwrap().line.end;
        let cursor_world = b.to_world(Point::new(990.0, 400.0));
        assert!(endpoint.distance_to(cursor_world) < 1e-9);
    }

    #[test]
    fn autopan_does_nothing_when_not_drawing() {
        let mut b = board();
        b.pan_by(-500.0, -300.0);
        b.pointer_move(Point::new(990.0, 400.0));
        let before = b.state.camera;
        b.tick(16.0);
        assert_eq!(b.state.camera, before);
    }

    #[test]
    fn adding_a_map_places_it_at_the_view_center_and_disturbs_nothing() {
        let mut b = board();
        b.set_mode(Mode::Draw);
        draw_line(&mut b, Point::new(100.0, 100.0), Point::new(300.0, 250.0));
        b.set_mode(Mode::Pan);
        b.drop_token(Point::new(25.0, 25.0), "t1".into(), TokenKind::Npc);
        b.pan_by(-1000.0, -1000.0);
        let camera = b.state.camera;

        let id = b.add_map("data:image/png;base64,x".into(), 2000.0, 1500.0);

        // Centered in the current view: view center is world (1500, 1400).
        let map = &b.state.maps[0];
        assert_eq!(map.id, id);
        assert_eq!((map.x, map.y), (1500.0 - 1000.0, 1400.0 - 750.0));

        // Content and view are untouched — maps are content, not config.
        assert_eq!(b.state.lines.len(), 1);
        assert_eq!(b.state.tokens.len(), 1);
        assert_eq!(b.state.camera, camera);

        b.remove_map(&id);
        assert!(b.state.maps.is_empty());
    }

    #[test]
    fn zoom_to_fit_frames_the_content() {
        let mut b = board();
        b.add_map("m".into(), 1000.0, 800.0); // placed centered at view center
        b.pan_by(-50_000.0, -50_000.0); // wander off

        b.zoom_to_fit();

        // The map fills the viewport again: its center is at the view center.
        let map = &b.state.maps[0];
        let center = b.to_world(Point::new(500.0, 400.0));
        assert!((center.x - (map.x + map.width / 2.0)).abs() < 1e-9);
        assert!((center.y - (map.y + map.height / 2.0)).abs() < 1e-9);
        assert_eq!(b.zoom(), 1.0); // min(1000/1000, 800/800)
    }

    #[test]
    fn zoom_to_fit_on_an_empty_board_frames_the_origin() {
        let mut b = board();
        b.pan_by(30_000.0, 30_000.0);
        b.zoom_to_fit();

        let center = b.to_world(Point::new(500.0, 400.0));
        assert!(center.x.abs() < 1e-9 && center.y.abs() < 1e-9);
    }

    #[test]
    fn revision_tracks_persistent_changes_only() {
        let mut b = board();
        let r0 = b.revision();

        b.pan_by(-10.0, -10.0);
        b.set_zoom(2.0);
        assert_eq!(b.revision(), r0, "camera moves are not persisted changes");

        b.drop_token(Point::new(25.0, 25.0), "t1".into(), TokenKind::Item);
        assert_eq!(b.revision(), r0 + 1);
    }

    #[test]
    fn snapshot_load_round_trip_preserves_content() {
        let mut b = board();
        b.set_mode(Mode::Draw);
        draw_line(&mut b, Point::new(100.0, 100.0), Point::new(300.0, 250.0));
        b.set_mode(Mode::Pan);
        b.drop_token(Point::new(125.0, 75.0), "t1".into(), TokenKind::Player);

        let snapshot = b.snapshot();

        let mut restored = board();
        restored.load_snapshot(&snapshot).unwrap();
        assert_eq!(restored.state, b.state);
    }

    #[test]
    fn load_snapshot_rejects_garbage() {
        let mut b = board();
        assert!(b.load_snapshot("not json").is_err());
    }

    #[test]
    fn load_snapshot_sanitizes_divisors() {
        let mut b = board();
        let poisoned = r#"{
            "version": 2, "cellSize": 0.0, "maps": [], "tokens": [], "lines": [],
            "nextId": 1, "camera": {"x": 0.0, "y": 0.0, "zoom": 0.0}
        }"#;
        b.load_snapshot(poisoned).unwrap();
        assert!(b.state.cell_size >= 1.0);
        assert!(b.zoom() >= MIN_ZOOM);
    }

    #[test]
    fn snapshot_taken_mid_endpoint_edit_still_contains_the_line() {
        let mut b = board();
        b.set_mode(Mode::Draw);
        draw_line(&mut b, Point::new(100.0, 100.0), Point::new(300.0, 250.0));

        // Pick up the end handle: the line leaves state.lines while editing.
        b.pointer_move(Point::new(300.0, 250.0));
        b.pointer_down(Point::new(300.0, 250.0), 0);
        b.pointer_up(Point::new(300.0, 250.0));
        assert!(b.state.lines.is_empty());

        // A save right now (autosave / tab close) must not lose the line.
        let saved = BoardState::from_json(&b.snapshot()).unwrap();
        assert_eq!(saved.lines.len(), 1);
        assert_eq!(saved.lines[0].end, Point::new(300.0, 250.0));
    }

    #[test]
    fn zoom_to_fit_frames_a_single_axis_aligned_line() {
        let mut b = board();
        b.set_mode(Mode::Draw);
        draw_line(&mut b, Point::new(100.0, 200.0), Point::new(300.0, 200.0));
        b.set_mode(Mode::Pan);
        b.pan_by(-50_000.0, -50_000.0);

        b.zoom_to_fit(); // height of the content box is 0 — must still frame

        let center = b.to_world(Point::new(500.0, 400.0));
        assert!((center.x - 200.0).abs() < 1e-9);
        assert!((center.y - 200.0).abs() < 1e-9);
    }

    #[test]
    fn scrollbars_hidden_on_an_empty_board() {
        let b = board();
        assert_eq!(b.scrollbar_metrics(), [0.0, 1.0, 0.0, 1.0]);
    }

    #[test]
    fn scrollbars_hidden_while_all_content_is_in_view() {
        let mut b = board();
        b.drop_token(Point::new(500.0, 400.0), "t1".into(), TokenKind::Player);
        let [_, h_size, _, v_size] = b.scrollbar_metrics();
        assert_eq!(h_size, 1.0);
        assert_eq!(v_size, 1.0);
    }

    #[test]
    fn thumb_appears_and_shrinks_the_further_you_pan_from_content() {
        let mut b = board();
        b.drop_token(Point::new(500.0, 400.0), "t1".into(), TokenKind::Player);

        // Pan right, past the content: a horizontal thumb appears...
        b.pan_by(-3_000.0, 0.0);
        let [h_start_1, h_size_1, _, v_size] = b.scrollbar_metrics();
        assert!(h_size_1 < 1.0);
        assert_eq!(v_size, 1.0, "no vertical overscroll yet");
        // ...sitting at the far (right) end of the track.
        assert!((h_start_1 + h_size_1 - 1.0).abs() < 1e-9);

        // Panning further shrinks it more.
        b.pan_by(-3_000.0, 0.0);
        let [_, h_size_2, _, _] = b.scrollbar_metrics();
        assert!(h_size_2 < h_size_1);

        // Diagonal overscroll shows the vertical thumb too.
        b.pan_by(0.0, -2_000.0);
        let [_, _, _, v_size_2] = b.scrollbar_metrics();
        assert!(v_size_2 < 1.0);

        // Panning back over the content hides them again.
        b.pan_by(6_000.0, 2_000.0);
        let [_, h_size_3, _, v_size_3] = b.scrollbar_metrics();
        assert_eq!(h_size_3, 1.0);
        assert_eq!(v_size_3, 1.0);
    }

    #[test]
    fn thumb_fractions_describe_viewport_within_the_scroll_range() {
        let mut b = board();
        // Content: one token cell at (0,0)..(50,50); pan so it sits exactly
        // one viewport-width to the left of the view.
        b.drop_token(Point::new(25.0, 25.0), "t1".into(), TokenKind::Player);
        b.pan_by(-1050.0, 0.0);

        // Screen range: content [-1050, -1000], viewport [0, 1000]
        // → range [-1050, 1000], len 2050.
        let [h_start, h_size, _, _] = b.scrollbar_metrics();
        assert!((h_size - 1000.0 / 2050.0).abs() < 1e-9);
        assert!((h_start - 1050.0 / 2050.0).abs() < 1e-9);
    }

    #[test]
    fn revisions_track_their_own_kinds_of_change() {
        let mut b = board();
        let frame = b.frame_revision();
        let structure = b.structure_revision();
        let camera = b.camera_revision();

        // Camera motion touches only the camera revision.
        b.pan_by(-1.0, 0.0);
        assert_eq!(b.frame_revision(), frame);
        assert_eq!(b.structure_revision(), structure);
        assert!(b.camera_revision() > camera);

        // Adding an entity bumps structure and frame, not camera.
        let camera = b.camera_revision();
        b.drop_token(Point::new(25.0, 25.0), "t1".into(), TokenKind::Item);
        assert!(b.frame_revision() > frame);
        assert!(b.structure_revision() > structure);
        assert_eq!(b.camera_revision(), camera);
    }
}
