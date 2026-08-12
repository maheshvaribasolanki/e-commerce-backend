import { Router } from "express";
import { Order } from "../../models/Order.js";
import { requireAdmin } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ok } from "../../utils/envelope.js";
import { requireFound, requireText } from "../../utils/helpers.js";
import { AppError } from "../../utils/AppError.js";
import { Product } from "../../models/Product.js";
const ALLOWED_ORDER_STATUSES = [
    "placed",
    "shipped",
    "delivered",
    "returned",
    "cancelled",
];
export const adminOrderRouter = Router();
adminOrderRouter.use(requireAdmin);
adminOrderRouter.get("/orders", asyncHandler(async (req, res) => {
    const orders = await Order.find()
        .select("customerName customerEmail totalItems totalAmount paymentStatus orderStatus  paidAt deliveredAt returnedAt createdAt")
        .sort({ createdAt: -1 })
        .lean();
    res.json(ok({
        items: orders.map((orderItem) => ({
            _id: String(orderItem._id),
            code: String(orderItem._id).slice(-8).toUpperCase(),
            customerName: orderItem.customerName,
            customerEmail: orderItem.customerEmail,
            totalItems: orderItem.totalItems,
            totalAmount: orderItem.totalAmount,
            paymentStatus: orderItem.paymentStatus,
            orderStatus: orderItem.orderStatus,
            paidAt: orderItem.paidAt,
            deliveredAt: orderItem.deliveredAt,
            returnedAt: orderItem.returnedAt,
            createdAt: orderItem.createdAt,
        })),
    }));
}));
adminOrderRouter.patch("/orders/:orderId/status", asyncHandler(async (req, res) => {
    const orderId = String(req.params.orderId || "").trim();
    const orderStatus = String(req.body.orderStatus || "").trim();
    requireText(orderId, "Order Id is required");
    requireText(orderStatus, "orderStatus is required");
    if (!ALLOWED_ORDER_STATUSES.includes(orderStatus)) {
        throw new AppError(400, "Invalid order status");
    }
    const order = await Order.findById(orderId);
    const foundOrder = requireFound(order, "Order not found", 404);
    // admin can return order -> increase the product quantity
    // update returnedAt property
    // add the points to that user points
    if (orderStatus === "returned" && foundOrder.orderStatus !== "returned") {
        for (const item of foundOrder.items) {
            await Product.updateOne({ _id: item.product }, {
                $inc: { stock: item.quantity },
            });
        }
    }
    if (orderStatus === "delivered" && !foundOrder.deliveredAt) {
        foundOrder.deliveredAt = new Date();
    }
    foundOrder.orderStatus = orderStatus;
    await foundOrder.save();
    res.json(ok({
        _id: String(foundOrder._id),
        orderStatus: foundOrder.orderStatus,
        deliveredAt: foundOrder.deliveredAt,
        returnedAt: foundOrder.returnedAt,
    }));
}));
