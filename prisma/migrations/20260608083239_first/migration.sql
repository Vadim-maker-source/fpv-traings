/*
  Warnings:

  - Added the required column `time` to the `GameRound` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameRound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "challenge1" REAL NOT NULL,
    "challenge2" REAL NOT NULL,
    "challenge3" REAL NOT NULL,
    "challenge4" REAL NOT NULL,
    "time" REAL NOT NULL,
    "totalScore" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameRound_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GameRound" ("challenge1", "challenge2", "challenge3", "challenge4", "createdAt", "id", "totalScore", "userId") SELECT "challenge1", "challenge2", "challenge3", "challenge4", "createdAt", "id", "totalScore", "userId" FROM "GameRound";
DROP TABLE "GameRound";
ALTER TABLE "new_GameRound" RENAME TO "GameRound";
CREATE TABLE "new_Lesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "lessonNumber" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "meetLink" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    CONSTRAINT "Lesson_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Lesson_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Lesson" ("id", "lessonNumber", "meetLink", "scheduledAt", "status", "studentId", "teacherId", "topic") SELECT "id", "lessonNumber", "meetLink", "scheduledAt", "status", "studentId", "teacherId", "topic" FROM "Lesson";
DROP TABLE "Lesson";
ALTER TABLE "new_Lesson" RENAME TO "Lesson";
CREATE TABLE "new_Support" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "answer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Support_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Support" ("answer", "createdAt", "description", "id", "status", "topic", "userId") SELECT "answer", "createdAt", "description", "id", "status", "topic", "userId" FROM "Support";
DROP TABLE "Support";
ALTER TABLE "new_Support" RENAME TO "Support";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
