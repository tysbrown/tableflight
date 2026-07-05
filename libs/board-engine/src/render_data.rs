//! Frame-data extraction for the renderer. The engine is headless: each
//! frame the renderer pulls compact typed-array buffers describing what to
//! draw, rather than the engine issuing draw calls. Layouts here are the
//! contract with the TypeScript side (apps/ui/src/board) — change both
//! together.

use crate::board::Board;
use crate::state::{Point, TokenKind};

/// tokens buffer: `[worldCenterX, worldCenterY, kind, flags]` per token.
pub const TOKEN_STRIDE: usize = 4;
pub const TOKEN_FLAG_DRAGGING: u32 = 1;

/// lines buffer: `[x1, y1, x2, y2, width, flags]` per line. The in-progress
/// line (drawing or endpoint edit), when present, is the last entry.
pub const LINE_STRIDE: usize = 6;
pub const LINE_FLAG_HOVERED: u32 = 1;
pub const LINE_FLAG_IN_PROGRESS: u32 = 1 << 1;
pub const LINE_FLAG_STRAIGHT_HINT: u32 = 1 << 2;

/// Token kinds by index — the TS renderer's color table uses the same order.
pub fn kind_index(kind: TokenKind) -> f32 {
    match kind {
        TokenKind::Player => 0.0,
        TokenKind::Enemy => 1.0,
        TokenKind::Npc => 2.0,
        TokenKind::Item => 3.0,
    }
}

/// maps buffer: `[x, y, width, height]` per placed asset, parallel to `mapsJson` order.
pub const MAP_STRIDE: usize = 4;

/// `[x, y, zoom]` — f64 because camera coordinates span the whole world.
pub fn camera(board: &Board) -> Vec<f64> {
    let cam = board.state.camera;
    vec![cam.x, cam.y, cam.zoom]
}

pub fn maps(board: &Board) -> Vec<f32> {
    let mut out = Vec::with_capacity(board.state.maps.len() * MAP_STRIDE);
    for map in &board.state.maps {
        out.extend([
            map.x as f32,
            map.y as f32,
            map.width as f32,
            map.height as f32,
        ]);
    }
    out
}

/// `[x, y, width, height]` of the selected asset, or empty.
pub fn selection(board: &Board) -> Vec<f32> {
    match board.selection_rect() {
        Some(rect) => rect.iter().map(|v| *v as f32).collect(),
        None => Vec::new(),
    }
}

pub fn tokens(board: &Board) -> Vec<f32> {
    let cell = board.state.cell_size;
    let dragged = board.dragged_token();

    let mut out = Vec::with_capacity(board.state.tokens.len() * TOKEN_STRIDE);
    for (index, token) in board.state.tokens.iter().enumerate() {
        // A dragged token follows the cursor instead of sitting in its cell.
        let (center, flags) = match dragged {
            Some((dragged_index, at)) if dragged_index == index => {
                (at, TOKEN_FLAG_DRAGGING)
            }
            _ => (
                Point::new(
                    (token.col as f64 + 0.5) * cell,
                    (token.row as f64 + 0.5) * cell,
                ),
                0,
            ),
        };
        out.extend([
            center.x as f32,
            center.y as f32,
            kind_index(token.kind),
            flags as f32,
        ]);
    }
    out
}

pub fn lines(board: &Board) -> Vec<f32> {
    let mut out =
        Vec::with_capacity((board.state.lines.len() + 1) * LINE_STRIDE);

    let mut push = |line: &crate::state::Line, flags: u32| {
        out.extend([
            line.start.x as f32,
            line.start.y as f32,
            line.end.x as f32,
            line.end.y as f32,
            line.width as f32,
            flags as f32,
        ]);
    };

    for line in &board.state.lines {
        let hovered = board.hovered_line() == Some(line.id.as_str());
        push(line, if hovered { LINE_FLAG_HOVERED } else { 0 });
    }

    if let Some(draw) = board.draw_in_progress() {
        let mut flags = LINE_FLAG_IN_PROGRESS;
        if Board::is_straight(&draw.line) {
            flags |= LINE_FLAG_STRAIGHT_HINT;
        }
        push(&draw.line, flags);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::board::Mode;
    use crate::state::TokenKind;

    fn board() -> Board {
        let mut board = Board::new();
        board.set_viewport(1000.0, 800.0);
        board
    }

    #[test]
    fn camera_buffer_layout() {
        let mut b = board();
        b.pan_by(-10.0, -20.0);
        b.set_zoom(2.0);
        let cam = camera(&b);
        assert_eq!(cam.len(), 3);
        assert_eq!(cam[2], 2.0);
    }

    #[test]
    fn tokens_buffer_packs_center_kind_and_drag_flag() {
        let mut b = board();
        b.drop_token(Point::new(125.0, 75.0), "t1".into(), TokenKind::Enemy);

        let buffer = tokens(&b);
        assert_eq!(buffer.len(), TOKEN_STRIDE);
        // Cell (2, 1) at cellSize 50 → center (125, 75).
        assert_eq!(&buffer[..], &[125.0, 75.0, 1.0, 0.0]);

        // Mid-drag the token follows the cursor and is flagged.
        b.pointer_down(Point::new(125.0, 75.0), 0);
        b.pointer_move(Point::new(300.0, 200.0));
        let buffer = tokens(&b);
        assert_eq!(&buffer[..2], &[300.0, 200.0]);
        assert_eq!(buffer[3], TOKEN_FLAG_DRAGGING as f32);
    }

    #[test]
    fn lines_buffer_appends_the_in_progress_line_with_flags() {
        let mut b = board();
        b.set_mode(Mode::Draw);

        // Committed line.
        b.pointer_down(Point::new(100.0, 100.0), 0);
        b.pointer_up(Point::new(100.0, 100.0));
        b.pointer_move(Point::new(300.0, 250.0));
        b.pointer_down(Point::new(300.0, 250.0), 0);
        b.pointer_up(Point::new(300.0, 250.0));

        // New in-progress line, currently axis-aligned (straight hint).
        b.pointer_down(Point::new(400.0, 400.0), 0);
        b.pointer_up(Point::new(400.0, 400.0));
        b.pointer_move(Point::new(500.0, 400.0));

        let buffer = lines(&b);
        assert_eq!(buffer.len(), 2 * LINE_STRIDE);

        let committed = &buffer[..LINE_STRIDE];
        assert_eq!(&committed[..4], &[100.0, 100.0, 300.0, 250.0]);
        assert_eq!(committed[5], 0.0);

        let in_progress = &buffer[LINE_STRIDE..];
        assert_eq!(&in_progress[..4], &[400.0, 400.0, 500.0, 400.0]);
        assert_eq!(
            in_progress[5] as u32,
            LINE_FLAG_IN_PROGRESS | LINE_FLAG_STRAIGHT_HINT,
        );
    }

    #[test]
    fn maps_and_selection_buffers_expose_live_geometry() {
        let mut b = board();
        assert!(selection(&b).is_empty());

        b.drop_map(Point::new(500.0, 400.0), "a".into(), 200.0, 100.0);
        assert_eq!(maps(&b), vec![400.0, 350.0, 200.0, 100.0]);
        assert_eq!(selection(&b), vec![400.0, 350.0, 200.0, 100.0]);

        // buffers track the drag before persistence
        b.pointer_down(Point::new(500.0, 400.0), 0);
        b.pointer_move(Point::new(550.0, 400.0));
        assert_eq!(maps(&b)[0], 450.0);
        assert_eq!(selection(&b)[0], 450.0);
    }

    #[test]
    fn hovered_line_is_flagged() {
        let mut b = board();
        b.set_mode(Mode::Draw);
        b.pointer_down(Point::new(100.0, 100.0), 0);
        b.pointer_up(Point::new(100.0, 100.0));
        b.pointer_move(Point::new(300.0, 100.0));
        b.pointer_down(Point::new(300.0, 100.0), 0);
        b.pointer_up(Point::new(300.0, 100.0));

        b.pointer_move(Point::new(200.0, 103.0)); // hover the body
        let buffer = lines(&b);
        assert_eq!(buffer[5] as u32, LINE_FLAG_HOVERED);
    }
}
