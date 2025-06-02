-- CreateTable
CREATE TABLE "FileDownload" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "userId" TEXT,
    "purchaseId" TEXT,
    "downloadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "metadata" TEXT,

    CONSTRAINT "FileDownload_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FileDownload" ADD CONSTRAINT "FileDownload_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileDownload" ADD CONSTRAINT "FileDownload_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
