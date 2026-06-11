-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "LessonStatus" AS ENUM ('SCHEDULED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SupportStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "birthDate" TEXT,
    "passport" TEXT,
    "medicalDocuments" TEXT,
    "bio" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "teacherId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "lessonNumber" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "meetLink" TEXT,
    "status" "LessonStatus" NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRound" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "challenge1" DOUBLE PRECISION NOT NULL,
    "challenge2" DOUBLE PRECISION NOT NULL,
    "challenge3" DOUBLE PRECISION NOT NULL,
    "challenge4" DOUBLE PRECISION NOT NULL,
    "time" DOUBLE PRECISION NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Support" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "answer" TEXT,
    "status" "SupportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Support_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Support" ADD CONSTRAINT "Support_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
