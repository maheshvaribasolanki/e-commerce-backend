import { Router } from "express";
import { requireAdmin } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Product } from "../../models/Product.js";
import { Category } from "../../models/Category.js";
import { Order } from "../../models/Order.js";
import { ok } from "../../utils/envelope.js";
export const adminDashboardRouter = Router();
adminDashboardRouter.use(requireAdmin);
adminDashboardRouter.get("/dashboard/lite", asyncHandler(async (_req, res) => {
    const [totalProducts, totalCategories, totalOrders, totalReturnedOrders, salesRows,] = await Promise.all([
        Product.countDocuments(),
        Category.countDocuments(),
        Order.countDocuments(),
        Order.countDocuments({ orderStatus: "returned" }),
        Order.aggregate([
            { $match: { paymentStatus: "paid" } },
            { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
        ]),
    ]);
    res.json(ok({
        totalProducts,
        totalCategories,
        totalSales: salesRows[0]?.totalSales || 0,
        totalOrders,
        totalReturnedOrders,
    }));
}));
