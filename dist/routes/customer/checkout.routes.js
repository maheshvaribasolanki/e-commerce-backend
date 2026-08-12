"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerCheckoutRouter = void 0;
const express_1 = require("express");
const Product_1 = require("../../models/Product");
const auth_1 = require("../../middleware/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
const helpers_1 = require("../../utils/helpers");
const User_1 = require("../../models/User");
const Cart_1 = require("../../models/Cart");
const AppError_1 = require("../../utils/AppError");
const Promo_1 = require("../../models/Promo");
const Order_1 = require("../../models/Order");
const envelope_1 = require("../../utils/envelope");
exports.customerCheckoutRouter = (0, express_1.Router)();
exports.customerCheckoutRouter.use(auth_1.requireAuth);
exports.customerCheckoutRouter.post("/checkout/place-order", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const dbUser = await (0, auth_1.getDbUserFromReq)(req);
    const addressId = String(req.body.addressId || "").trim();
    const promoCode = String(req.body.promoCode || "")
        .trim()
        .toUpperCase();
    (0, helpers_1.requireText)(addressId, "Address is required");
    // fetch user details and cart
    const [user, cart] = await Promise.all([
        User_1.User.findById(dbUser._id)
            .select("name email addresses")
            .lean(),
        Cart_1.Cart.findOne({ user: dbUser._id }).select("items").lean(),
    ]);
    const foundUser = (0, helpers_1.requireFound)(user, "User not found", 404);
    const foundCart = (0, helpers_1.requireFound)(cart, "Cart not found", 404);
    if (!foundCart.items.length) {
        throw new AppError_1.AppError(400, "Cart is empty");
    }
    const selectedAddress = foundUser.addresses.find((item) => String(item._id) === addressId);
    if (!selectedAddress) {
        throw new AppError_1.AppError(404, "Address not found");
    }
    const products = await Product_1.Product.find({
        _id: { $in: foundCart.items.map((item) => item.product) },
    })
        .select("price salePercentage stock status")
        .lean();
    const productMap = new Map(products.map((item) => [String(item._id), item]));
    let totalItems = 0;
    let subTotal = 0;
    const items = foundCart.items.map((cartItem) => {
        const product = productMap.get(String(cartItem.product));
        if (!product || product.status !== "active") {
            throw new AppError_1.AppError(400, "One or more cart items are not available");
        }
        if (product.stock < cartItem.quantity) {
            throw new AppError_1.AppError(400, "Cart items are out of stock");
        }
        const finalPrice = product.salePercentage
            ? Math.round(product.price - (product.price * product.salePercentage) / 100)
            : product.price;
        totalItems += cartItem.quantity;
        subTotal += finalPrice * cartItem.quantity;
        return {
            product: cartItem.product,
            quantity: cartItem.quantity,
        };
    });
    let appliedPromoCode = "";
    let discountAmount = 0;
    if (promoCode) {
        const promo = await Promo_1.Promo.findOne({ code: promoCode })
            .select("code percentage count minimumOrderValue startsAt endsAt")
            .lean();
        const foundPromo = (0, helpers_1.requireFound)(promo, "Promo not found", 404);
        const now = new Date();
        if (now < foundPromo.startsAt ||
            now > foundPromo.endsAt ||
            foundPromo.count < 1) {
            throw new AppError_1.AppError(400, "Promo code is not active");
        }
        if (subTotal < foundPromo.minimumOrderValue) {
            throw new AppError_1.AppError(400, "Minimum order value for this promo is not reached");
        }
        appliedPromoCode = foundPromo.code;
        discountAmount = Math.round((subTotal * foundPromo.percentage) / 100);
    }
    const totalAmount = Math.max(subTotal - discountAmount, 0);
    // Update product stock
    for (const item of items) {
        const updated = await Product_1.Product.updateOne({
            _id: item.product,
            stock: { $gte: item.quantity },
        }, {
            $inc: { stock: -item.quantity },
        });
        if (!updated.matchedCount) {
            throw new AppError_1.AppError(400, "One or more cart items are out of stock");
        }
    }
    // Decrement promo usage if applied
    if (appliedPromoCode) {
        await Promo_1.Promo.updateOne({
            code: appliedPromoCode,
            count: { $gt: 0 },
        }, {
            $inc: { count: -1 },
        });
    }
    // Clear cart
    await Cart_1.Cart.updateOne({ user: dbUser._id }, { $set: { items: [] } });
    const deliveryAddress = [
        selectedAddress.address,
        selectedAddress.state,
        selectedAddress.postalCode,
    ]
        .filter(Boolean)
        .join(", ");
    const paymentId = `order_${Date.now()}`;
    const order = await Order_1.Order.create({
        user: dbUser._id,
        customerName: foundUser.name || selectedAddress.fullName,
        customerEmail: foundUser.email || "",
        items,
        totalItems,
        deliveryName: selectedAddress.fullName,
        deliveryAddress,
        promoCode: appliedPromoCode,
        discountAmount,
        totalAmount,
        paymentStatus: "pending",
        orderStatus: "placed",
        paymentId,
    });
    res.json((0, envelope_1.ok)({
        _id: String(order._id),
        totalItems,
        discountAmount,
        totalAmount,
    }));
}));
