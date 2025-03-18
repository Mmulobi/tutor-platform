/*
  Warnings:

  - You are about to drop the column `grade` on the `StudentProfile` table. All the data in the column will be lost.
  - You are about to drop the column `subjects` on the `StudentProfile` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StudentProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "interests" TEXT,
    "gradeLevel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StudentProfile" ("bio", "createdAt", "id", "updatedAt", "userId") SELECT "bio", "createdAt", "id", "updatedAt", "userId" FROM "StudentProfile";
DROP TABLE "StudentProfile";
ALTER TABLE "new_StudentProfile" RENAME TO "StudentProfile";
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
