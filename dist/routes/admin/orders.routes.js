"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOrderRouter = void 0;
const express_1 = require("express");
const Order_1 = require("../../models/Order");
const auth_1 = require("../../middleware/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
const envelope_1 = require("../../utils/envelope");
const helpers_1 = require("../../utils/helpers");
const AppError_1 = require("../../utils/AppError");
const Product_1 = require("../../models/Product");
const ALLOWED_ORDER_STATUSES = [
    "placed",
    "shipped",
    "delivered",
    "returned",
    "cancelled",
];
exports.adminOrderRouter = (0, express_1.Router)();
exports.adminOrderRouter.use(auth_1.requireAdmin);
exports.adminOrderRouter.get("/orders", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const orders = await Order_1.Order.find()
        .select("customerName customerEmail totalItems totalAmount paymentStatus orderStatus  paidAt deliveredAt returnedAt createdAt")
        .sort({ createdAt: -1 })
        .lean();
    res.json((0, envelope_1.ok)({
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
exports.adminOrderRouter.patch("/orders/:orderId/status", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const orderId = String(req.params.orderId || "").trim();
    const orderStatus = String(req.body.orderStatus || "").trim();
    (0, helpers_1.requireText)(orderId, "Order Id is required");
    (0, helpers_1.requireText)(orderStatus, "orderStatus is required");
    if (!ALLOWED_ORDER_STATUSES.includes(orderStatus)) {
        throw new AppError_1.AppError(400, "Invalid order status");
    }
    const order = await Order_1.Order.findById(orderId);
    const foundOrder = (0, helpers_1.requireFound)(order, "Order not found", 404);
    // admin can return order -> increase the product quantity
    // update returnedAt property
    // add the points to that user points
    if (orderStatus === "returned" && foundOrder.orderStatus !== "returned") {
        for (const item of foundOrder.items) {
            await Product_1.Product.updateOne({ _id: item.product }, {
                $inc: { stock: item.quantity },
            });
        }
    }
    if (orderStatus === "delivered" && !foundOrder.deliveredAt) {
        foundOrder.deliveredAt = new Date();
    }
    foundOrder.orderStatus = orderStatus;
    await foundOrder.save();
    res.json((0, envelope_1.ok)({
        _id: String(foundOrder._id),
        orderStatus: foundOrder.orderStatus,
        deliveredAt: foundOrder.deliveredAt,
        returnedAt: foundOrder.returnedAt,
    }));
}));
