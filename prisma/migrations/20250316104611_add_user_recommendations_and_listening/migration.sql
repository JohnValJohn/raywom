-- CreateTable
CREATE TABLE "UserRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recommenderId" TEXT NOT NULL,
    "recommendedId" TEXT NOT NULL,
    CONSTRAINT "UserRecommendation_recommenderId_fkey" FOREIGN KEY ("recommenderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserRecommendation_recommendedId_fkey" FOREIGN KEY ("recommendedId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserListening" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listenerId" TEXT NOT NULL,
    "listenedToId" TEXT NOT NULL,
    CONSTRAINT "UserListening_listenerId_fkey" FOREIGN KEY ("listenerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserListening_listenedToId_fkey" FOREIGN KEY ("listenedToId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UserRecommendation_recommenderId_idx" ON "UserRecommendation"("recommenderId");

-- CreateIndex
CREATE INDEX "UserRecommendation_recommendedId_idx" ON "UserRecommendation"("recommendedId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRecommendation_recommenderId_recommendedId_key" ON "UserRecommendation"("recommenderId", "recommendedId");

-- CreateIndex
CREATE INDEX "UserListening_listenerId_idx" ON "UserListening"("listenerId");

-- CreateIndex
CREATE INDEX "UserListening_listenedToId_idx" ON "UserListening"("listenedToId");

-- CreateIndex
CREATE UNIQUE INDEX "UserListening_listenerId_listenedToId_key" ON "UserListening"("listenerId", "listenedToId");
