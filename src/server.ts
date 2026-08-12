import 'dotenv/config'
import express from 'express'
import { connectDB } from './db.js'
import cors from 'cors'
import morgan from 'morgan'
import { ok } from "./utils/envelope.js";
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorhandler.js'
import { clerkMiddleware } from '@clerk/express'
import { authRouter } from './routes/auth/auth.routes.js'

import { adminDashboardRouter } from './routes/admin/dashboard.routes.js'
import { adminProductRouter } from './routes/admin/product.routes.js'
import { adminOrderRouter } from './routes/admin/orders.routes.js'
import { adminPromoRouter } from './routes/admin/promo.routes.js'
import { adminSettingsRouter } from './routes/admin/settings.routes.js'

import { customerHomeRouter } from './routes/customer/home.routes.js'
import { customerProductRouter } from './routes/customer/product.routes.js'
import { customerCartWishlistRouter } from './routes/customer/cart-wishlist.routes.js'
import { customerCheckoutRouter } from './routes/customer/checkout.routes.js'
import { customerCheckoutWithPointsRouter } from './routes/customer/checkout-with-points.routes.js'
import { customerOrderRouter } from './routes/customer/orders.routes.js'
import { customerPromoRouter } from './routes/customer/promo.routes.js'
import { customerAddressRouter } from './routes/customer/address.routes.js'

async function mainEntryFunction() {
  await connectDB()

  const app = express()
  const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5174")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean)

  app.use(
    cors({
      origin: corsOrigins,
      credentials: true
    })
  )
  app.use(express.json())
  app.use(morgan('dev'))

  // Clerk authentication middleware must run before authenticated routes
  app.use(clerkMiddleware())

  app.get("/health", (_req, res) => {
    res.status(200).json(ok({ message: "Server is healthy/in running state" }));
  });

  // Auth routes
  app.use("/auth", authRouter);

  // Admin routes (mounted with and without /api prefix)
  app.use("/api/admin", adminDashboardRouter);
  app.use("/api/admin", adminProductRouter);
  app.use("/api/admin", adminOrderRouter);
  app.use("/api/admin", adminPromoRouter);
  app.use("/api/admin", adminSettingsRouter);

  app.use("/admin", adminDashboardRouter);
  app.use("/admin", adminProductRouter);
  app.use("/admin", adminOrderRouter);
  app.use("/admin", adminPromoRouter);
  app.use("/admin", adminSettingsRouter);

  // Customer routes (mounted with and without /api prefix)
  app.use("/api/customer", customerHomeRouter);
  app.use("/api/customer", customerProductRouter);
  app.use("/api/customer", customerCartWishlistRouter);
  app.use("/api/customer", customerCheckoutRouter);
  app.use("/api/customer", customerCheckoutWithPointsRouter);
  app.use("/api/customer", customerOrderRouter);
  app.use("/api/customer", customerPromoRouter);
  app.use("/api/customer", customerAddressRouter);

  app.use("/customer", customerHomeRouter);
  app.use("/customer", customerProductRouter);
  app.use("/customer", customerCartWishlistRouter);
  app.use("/customer", customerCheckoutRouter);
  app.use("/customer", customerCheckoutWithPointsRouter);
  app.use("/customer", customerOrderRouter);
  app.use("/customer", customerPromoRouter);
  app.use("/customer", customerAddressRouter);

  // 404 & Error handlers must be mounted last
  app.use(notFound);
  app.use(errorHandler);

  const port = Number(process.env.PORT || 5000);

  app.listen(port, () => {
    console.log(`Server is now listening to port ${port}`);
  });
}

mainEntryFunction().catch((err) => {
  console.error("failed to start", err);
  process.exit(1);
});
