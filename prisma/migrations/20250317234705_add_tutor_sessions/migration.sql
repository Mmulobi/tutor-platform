-- CreateTable
CREATE TABLE "TutorSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "meetingLink" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TutorSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TutorSession_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "isGroupSession" BOOLEAN NOT NULL DEFAULT false,
    "price" REAL NOT NULL,
    "notes" TEXT,
    "meetingLink" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("createdAt", "endTime", "id", "isGroupSession", "meetingLink", "notes", "price", "startTime", "status", "studentId", "subject", "tutorId", "updatedAt") SELECT "createdAt", "endTime", "id", "isGroupSession", "meetingLink", "notes", "price", "startTime", "status", "studentId", "subject", "tutorId", "updatedAt" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT,
    "bookingId" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paymentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TutorSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "bookingId", "createdAt", "currency", "id", "paymentId", "paymentMethod", "status", "updatedAt") SELECT "amount", "bookingId", "createdAt", "currency", "id", "paymentId", "paymentMethod", "status", "updatedAt" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE UNIQUE INDEX "Payment_sessionId_key" ON "Payment"("sessionId");
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");
CREATE TABLE "new_Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT,
    "bookingId" TEXT,
    "studentId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Review_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TutorSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Review" ("bookingId", "comment", "createdAt", "id", "rating", "studentId", "tutorId", "updatedAt") SELECT "bookingId", "comment", "createdAt", "id", "rating", "studentId", "tutorId", "updatedAt" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
CREATE UNIQUE INDEX "Review_sessionId_key" ON "Review"("sessionId");
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
