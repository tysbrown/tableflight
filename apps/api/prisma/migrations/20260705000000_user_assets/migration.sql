-- User-scoped asset library: uploaded images staged in the Assets panel and
-- placeable on boards. Image bytes live in the database until object storage
-- (S3) lands; boards reference assets by URL (/api/assets/:id).
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Asset_userId_idx" ON "Asset"("userId");

ALTER TABLE "Asset" ADD CONSTRAINT "Asset_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
