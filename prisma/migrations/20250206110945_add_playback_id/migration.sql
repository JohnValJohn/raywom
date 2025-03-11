/*
  Warnings:

  - Added the required column `playbackId` to the `UserVideo` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserVideo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uploadId" TEXT NOT NULL,
    "playbackId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "UserVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserVideo" ("id", "status", "uploadId", "userId") SELECT "id", "status", "uploadId", "userId" FROM "UserVideo";
DROP TABLE "UserVideo";
ALTER TABLE "new_UserVideo" RENAME TO "UserVideo";
CREATE UNIQUE INDEX "UserVideo_userId_key" ON "UserVideo"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
