"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDashboardRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
const Product_1 = require("../../models/Product");
const Category_1 = require("../../models/Category");
const Order_1 = require("../../models/Order");
const envelope_1 = require("../../utils/envelope");
exports.adminDashboardRouter = (0, express_1.Router)();
exports.adminDashboardRouter.use(auth_1.requireAdmin);
exports.adminDashboardRouter.get("/dashboard/lite", (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    const [totalProducts, totalCategories, totalOrders, totalReturnedOrders, salesRows,] = await Promise.all([
        Product_1.Product.countDocuments(),
        Category_1.Category.countDocuments(),
        Order_1.Order.countDocuments(),
        Order_1.Order.countDocuments({ orderStatus: "returned" }),
        Order_1.Order.aggregate([
            { $match: { paymentStatus: "paid" } },
            { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
        ]),
    ]);
    res.json((0, envelope_1.ok)({
        totalProducts,
        totalCategories,
        totalSales: salesRows[0]?.totalSales || 0,
        totalOrders,
        totalReturnedOrders,
    }));
}));
