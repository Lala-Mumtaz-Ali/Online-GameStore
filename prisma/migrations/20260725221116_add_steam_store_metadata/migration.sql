-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "steamGenreId" INTEGER;

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "aboutHtml" TEXT,
ADD COLUMN     "developer" TEXT,
ADD COLUMN     "headerImage" TEXT,
ADD COLUMN     "metacriticScore" INTEGER,
ADD COLUMN     "metacriticUrl" TEXT,
ADD COLUMN     "onLinux" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onMac" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "onWindows" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "publisher" TEXT,
ADD COLUMN     "reviewCount" INTEGER,
ADD COLUMN     "steamAppId" INTEGER,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "steamId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameScreenshot" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "GameScreenshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameTrailer" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "hlsUrl" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "GameTrailer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FeatureToGame" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FeatureToGame_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Feature_steamId_key" ON "Feature"("steamId");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_slug_key" ON "Feature"("slug");

-- CreateIndex
CREATE INDEX "GameScreenshot_gameId_idx" ON "GameScreenshot"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameScreenshot_gameId_position_key" ON "GameScreenshot"("gameId", "position");

-- CreateIndex
CREATE INDEX "GameTrailer_gameId_idx" ON "GameTrailer"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "GameTrailer_gameId_position_key" ON "GameTrailer"("gameId", "position");

-- CreateIndex
CREATE INDEX "_FeatureToGame_B_index" ON "_FeatureToGame"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Category_steamGenreId_key" ON "Category"("steamGenreId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_steamAppId_key" ON "Game"("steamAppId");

-- AddForeignKey
ALTER TABLE "GameScreenshot" ADD CONSTRAINT "GameScreenshot_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameTrailer" ADD CONSTRAINT "GameTrailer_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FeatureToGame" ADD CONSTRAINT "_FeatureToGame_A_fkey" FOREIGN KEY ("A") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FeatureToGame" ADD CONSTRAINT "_FeatureToGame_B_fkey" FOREIGN KEY ("B") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

