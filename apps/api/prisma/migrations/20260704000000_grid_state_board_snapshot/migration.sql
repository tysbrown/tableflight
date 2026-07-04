/*
  The board was refactored into a Rust/WebAssembly engine (libs/board-engine)
  that owns the whole board document. GridState now stores that engine's JSON
  snapshot verbatim instead of one column per field.

  Existing rows (old column layout) are dropped rather than migrated — the old
  columns never stored drawn lines, so there is no complete board to convert.
*/
ALTER TABLE "GridState"
  DROP COLUMN "grid",
  DROP COLUMN "rows",
  DROP COLUMN "cols",
  DROP COLUMN "cellSize",
  DROP COLUMN "dimensions",
  DROP COLUMN "backgroundImage",
  DROP COLUMN "lineWidth",
  DROP COLUMN "zoomLevel",
  DROP COLUMN "position",
  ADD COLUMN "state" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "GridState" ALTER COLUMN "state" DROP DEFAULT;
ALTER TABLE "GridState" ALTER COLUMN "updatedAt" DROP DEFAULT;
