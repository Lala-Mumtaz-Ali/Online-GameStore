-- CreateIndex
CREATE INDEX "Preorder_gameId_idx" ON "Preorder"("gameId");

-- CreateIndex
CREATE INDEX "ReleaseNotifyRequest_gameId_idx" ON "ReleaseNotifyRequest"("gameId");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_gameId_idx" ON "OrderItem"("gameId");
