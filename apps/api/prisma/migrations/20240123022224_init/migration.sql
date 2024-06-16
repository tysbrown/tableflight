-- DropForeignKey
ALTER TABLE "Game" DROP CONSTRAINT "Game_createdById_fkey";

-- CreateTable
CREATE TABLE "GridState" (
    "gameSessionID" INTEGER NOT NULL,
    "grid" JSONB NOT NULL,
    "rows" INTEGER NOT NULL,
    "cols" INTEGER NOT NULL,
    "cellSize" INTEGER NOT NULL,
    "dimensions" JSONB NOT NULL,
    "backgroundImage" TEXT,
    "lineWidth" DOUBLE PRECISION,
    "zoomLevel" DOUBLE PRECISION,
    "position" JSONB NOT NULL,

    CONSTRAINT "GridState_pkey" PRIMARY KEY ("gameSessionID")
);

-- CreateTable
CREATE TABLE "CharacterSheet" (
    "id" SERIAL NOT NULL,
    "data" JSONB NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "CharacterSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GamesParticipating" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_GamesParticipating_AB_unique" ON "_GamesParticipating"("A", "B");

-- CreateIndex
CREATE INDEX "_GamesParticipating_B_index" ON "_GamesParticipating"("B");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GridState" ADD CONSTRAINT "GridState_gameSessionID_fkey" FOREIGN KEY ("gameSessionID") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterSheet" ADD CONSTRAINT "CharacterSheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GamesParticipating" ADD CONSTRAINT "_GamesParticipating_A_fkey" FOREIGN KEY ("A") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GamesParticipating" ADD CONSTRAINT "_GamesParticipating_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
