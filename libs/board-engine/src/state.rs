//! Serializable board state. This is the single source of truth for a game
//! session's board: the JSON produced by [`BoardState::to_json`] is what gets
//! persisted to the database and shared with other players in the session.
//!
//! Schema history:
//! - v1: bounded board sized to a single optional background image.
//! - v2: one open world; map images are placeable objects (`maps`), the
//!   camera roams freely within [`WORLD_HALF_EXTENT`]. v1 snapshots are
//!   migrated on load ([`migrate_v1`]) and saved back as v2.

use serde::{Deserialize, Serialize};

pub const SCHEMA_VERSION: u32 = 2;

/// The world is open but finite: the camera center is clamped to
/// ±`WORLD_HALF_EXTENT` on both axes. 2^17 px keeps f32 rounding error in a
/// GPU renderer's transforms ≤ 0.016 px while allowing a ~5,200×5,200-cell
/// playing field — vast beyond any campaign.
pub const WORLD_HALF_EXTENT: f64 = 131_072.0;

pub const MIN_ZOOM: f64 = 0.1;
pub const MAX_ZOOM: f64 = 5.0;

#[derive(Debug, Clone, Copy, PartialEq, Default, Serialize, Deserialize)]
pub struct Point {
    pub x: f64,
    pub y: f64,
}

impl Point {
    pub fn new(x: f64, y: f64) -> Self {
        Self { x, y }
    }

    pub fn distance_to(&self, other: Point) -> f64 {
        (self.x - other.x).hypot(self.y - other.y)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TokenKind {
    Player,
    Enemy,
    Npc,
    Item,
}

impl TokenKind {
    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "player" => Some(Self::Player),
            "enemy" => Some(Self::Enemy),
            "npc" => Some(Self::Npc),
            "item" => Some(Self::Item),
            _ => None,
        }
    }
}

/// A token occupying one grid cell. At most one token per cell.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Token {
    pub id: String,
    pub kind: TokenKind,
    pub col: i32,
    pub row: i32,
}

/// A drawn line segment, in world (board) coordinates.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Line {
    pub id: String,
    pub start: Point,
    pub end: Point,
    pub width: f64,
}

/// A map image placed on the world. `url` is opaque to the engine (data URL
/// today, asset URL later); `width`/`height` are world pixels.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MapImage {
    pub id: String,
    pub url: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/// The view transform: `screen = world * zoom + (x, y)`.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Camera {
    pub x: f64,
    pub y: f64,
    pub zoom: f64,
}

impl Default for Camera {
    fn default() -> Self {
        Self { x: 0.0, y: 0.0, zoom: 1.0 }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BoardState {
    pub version: u32,
    pub cell_size: f64,
    pub maps: Vec<MapImage>,
    pub tokens: Vec<Token>,
    pub lines: Vec<Line>,
    /// Monotonic counter used to mint stable entity ids (lines, maps, ...).
    pub next_id: u64,
    pub camera: Camera,
}

impl Default for BoardState {
    fn default() -> Self {
        Self {
            version: SCHEMA_VERSION,
            cell_size: 50.0,
            maps: Vec::new(),
            tokens: Vec::new(),
            lines: Vec::new(),
            next_id: 1,
            camera: Camera::default(),
        }
    }
}

impl BoardState {
    pub fn mint_id(&mut self, prefix: &str) -> String {
        let id = format!("{prefix}-{}", self.next_id);
        self.next_id += 1;
        id
    }

    pub fn to_json(&self) -> String {
        serde_json::to_string(self).expect("board state is always serializable")
    }

    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        #[derive(Deserialize)]
        struct VersionProbe {
            version: u32,
        }

        let probe: VersionProbe = serde_json::from_str(json)?;
        match probe.version {
            1 => Ok(migrate_v1(serde_json::from_str(json)?)),
            _ => serde_json::from_str(json),
        }
    }
}

// --- v1 migration (kept permanently — it is ~30 lines) -----------------------

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct V1Background {
    url: String,
    width: f64,
    height: f64,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct V1BoardState {
    cell_size: f64,
    background: Option<V1Background>,
    tokens: Vec<Token>,
    lines: Vec<Line>,
    next_line_id: u64,
    camera: Camera,
}

/// v1's single bounded background becomes the first placeable map at the
/// origin — exactly where the board content already lived.
fn migrate_v1(v1: V1BoardState) -> BoardState {
    let mut state = BoardState {
        version: SCHEMA_VERSION,
        cell_size: v1.cell_size,
        maps: Vec::new(),
        tokens: v1.tokens,
        lines: v1.lines,
        next_id: v1.next_line_id,
        camera: v1.camera,
    };

    if let Some(background) = v1.background {
        let id = state.mint_id("map");
        state.maps.push(MapImage {
            id,
            url: background.url,
            x: 0.0,
            y: 0.0,
            width: background.width,
            height: background.height,
        });
    }
    state
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn snapshot_round_trips() {
        let mut state = BoardState::default();
        state.tokens.push(Token {
            id: "t1".into(),
            kind: TokenKind::Player,
            col: -3,
            row: 5,
        });
        state.lines.push(Line {
            id: "line-1".into(),
            start: Point::new(10.0, 20.0),
            end: Point::new(30.0, 40.0),
            width: 2.0,
        });
        state.maps.push(MapImage {
            id: "map-2".into(),
            url: "data:image/png;base64,abc".into(),
            x: -500.0,
            y: 250.0,
            width: 1024.0,
            height: 768.0,
        });

        let restored = BoardState::from_json(&state.to_json()).unwrap();
        assert_eq!(restored, state);
    }

    #[test]
    fn snapshot_uses_camel_case_for_the_typescript_side() {
        let json = BoardState::default().to_json();
        assert!(json.contains("\"cellSize\""));
        assert!(json.contains("\"nextId\""));
    }

    #[test]
    fn minted_ids_are_unique_across_entity_kinds() {
        let mut state = BoardState::default();
        let line = state.mint_id("line");
        let map = state.mint_id("map");
        assert_eq!(line, "line-1");
        assert_eq!(map, "map-2");
    }

    /// A real v1 snapshot (the previous schema) must load and become v2.
    #[test]
    fn v1_snapshot_migrates_to_v2() {
        let v1 = r#"{
            "version": 1,
            "cellSize": 40.0,
            "background": {"url": "data:image/png;base64,xyz", "width": 2000.0, "height": 1500.0},
            "tokens": [{"id": "t1", "kind": "player", "col": 3, "row": 5}],
            "lines": [{"id": "line-1", "start": {"x": 1.0, "y": 2.0}, "end": {"x": 3.0, "y": 4.0}, "width": 2.0}],
            "nextLineId": 2,
            "camera": {"x": -10.0, "y": -20.0, "zoom": 1.5}
        }"#;

        let state = BoardState::from_json(v1).unwrap();

        assert_eq!(state.version, SCHEMA_VERSION);
        assert_eq!(state.cell_size, 40.0);
        assert_eq!(state.maps.len(), 1);
        let map = &state.maps[0];
        assert_eq!(map.id, "map-2");
        assert_eq!((map.x, map.y), (0.0, 0.0));
        assert_eq!((map.width, map.height), (2000.0, 1500.0));
        assert_eq!(state.tokens.len(), 1);
        assert_eq!(state.lines.len(), 1);
        assert_eq!(state.next_id, 3); // v1's counter, advanced past the map id
        assert_eq!(state.camera.zoom, 1.5);

        // Saving writes v2 — the v1 shape never round-trips back out.
        let json = state.to_json();
        assert!(json.contains("\"version\":2"));
        assert!(!json.contains("background"));
    }

    #[test]
    fn v1_snapshot_without_background_migrates_to_empty_maps() {
        let v1 = r#"{
            "version": 1, "cellSize": 50.0, "background": null,
            "tokens": [], "lines": [], "nextLineId": 1,
            "camera": {"x": 0.0, "y": 0.0, "zoom": 1.0}
        }"#;
        let state = BoardState::from_json(v1).unwrap();
        assert!(state.maps.is_empty());
        assert_eq!(state.next_id, 1);
    }
}
