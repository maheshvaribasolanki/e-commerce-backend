"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const db_1 = require("./db");
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const envelope_1 = require("./utils/envelope");
const notFound_1 = require("./middleware/notFound");
const errorhandler_1 = require("./middleware/errorhandler");
const express_2 = require("@clerk/express");
const auth_routes_1 = require("./routes/auth/auth.routes");
const dashboard_routes_1 = require("./routes/admin/dashboard.routes");
const product_routes_1 = require("./routes/admin/product.routes");
const orders_routes_1 = require("./routes/admin/orders.routes");
const promo_routes_1 = require("./routes/admin/promo.routes");
const settings_routes_1 = require("./routes/admin/settings.routes");
const home_routes_1 = require("./routes/customer/home.routes");
const product_routes_2 = require("./routes/customer/product.routes");
const cart_wishlist_routes_1 = require("./routes/customer/cart-wishlist.routes");
const checkout_routes_1 = require("./routes/customer/checkout.routes");
const checkout_with_points_routes_1 = require("./routes/customer/checkout-with-points.routes");
const orders_routes_2 = require("./routes/customer/orders.routes");
const promo_routes_2 = require("./routes/customer/promo.routes");
const address_routes_1 = require("./routes/customer/address.routes");
async function mainEntryFunction() {
    await (0, db_1.connectDB)();
    const app = (0, express_1.default)();
    const corsOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5173")
        .split(",")
        .map(origin => origin.trim())
        .filter(Boolean);
    app.use((0, cors_1.default)({
        origin: corsOrigins,
        credentials: true
    }));
    app.use(express_1.default.json());
    app.use((0, morgan_1.default)('dev'));
    // Clerk authentication middleware must run before authenticated routes
    app.use((0, express_2.clerkMiddleware)());
    app.get("/health", (_req, res) => {
        res.status(200).json((0, envelope_1.ok)({ message: "Server is healthy/in running state" }));
    });
    // Auth routes
    app.use("/auth", auth_routes_1.authRouter);
    // Admin routes (mounted with and without /api prefix)
    app.use("/api/admin", dashboard_routes_1.adminDashboardRouter);
    app.use("/api/admin", product_routes_1.adminProductRouter);
    app.use("/api/admin", orders_routes_1.adminOrderRouter);
    app.use("/api/admin", promo_routes_1.adminPromoRouter);
    app.use("/api/admin", settings_routes_1.adminSettingsRouter);
    app.use("/admin", dashboard_routes_1.adminDashboardRouter);
    app.use("/admin", product_routes_1.adminProductRouter);
    app.use("/admin", orders_routes_1.adminOrderRouter);
    app.use("/admin", promo_routes_1.adminPromoRouter);
    app.use("/admin", settings_routes_1.adminSettingsRouter);
    // Customer routes (mounted with and without /api prefix)
    app.use("/api/customer", home_routes_1.customerHomeRouter);
    app.use("/api/customer", product_routes_2.customerProductRouter);
    app.use("/api/customer", cart_wishlist_routes_1.customerCartWishlistRouter);
    app.use("/api/customer", checkout_routes_1.customerCheckoutRouter);
    app.use("/api/customer", checkout_with_points_routes_1.customerCheckoutWithPointsRouter);
    app.use("/api/customer", orders_routes_2.customerOrderRouter);
    app.use("/api/customer", promo_routes_2.customerPromoRouter);
    app.use("/api/customer", address_routes_1.customerAddressRouter);
    app.use("/customer", home_routes_1.customerHomeRouter);
    app.use("/customer", product_routes_2.customerProductRouter);
    app.use("/customer", cart_wishlist_routes_1.customerCartWishlistRouter);
    app.use("/customer", checkout_routes_1.customerCheckoutRouter);
    app.use("/customer", checkout_with_points_routes_1.customerCheckoutWithPointsRouter);
    app.use("/customer", orders_routes_2.customerOrderRouter);
    app.use("/customer", promo_routes_2.customerPromoRouter);
    app.use("/customer", address_routes_1.customerAddressRouter);
    // 404 & Error handlers must be mounted last
    app.use(notFound_1.notFound);
    app.use(errorhandler_1.errorHandler);
    const port = Number(process.env.PORT || 5000);
    app.listen(port, () => {
        console.log(`Server is now listening to port ${port}`);
    });
}
mainEntryFunction().catch((err) => {
    console.error("failed to start", err);
    process.exit(1);
});
