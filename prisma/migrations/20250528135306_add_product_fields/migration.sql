-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "allowPreOrders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bestSeller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contentLinks" TEXT,
ADD COLUMN     "curriculum" TEXT,
ADD COLUMN     "customBadges" TEXT,
ADD COLUMN     "customTrustIndicators" TEXT,
ADD COLUMN     "downloadLimit" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "instantDownload" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "linkExpiration" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "newRelease" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "popular" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "refundPolicy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "secureCheckout" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "stockQuantity" INTEGER,
ADD COLUMN     "whatsIncluded" TEXT;

-- CreateTable
CREATE TABLE "chat_history" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "query" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "timestamp" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB DEFAULT '{}',

    CONSTRAINT "chat_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "preferences" JSONB DEFAULT '{}',
    "last_login" TIMESTAMP(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "chat_history" ADD CONSTRAINT "chat_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
