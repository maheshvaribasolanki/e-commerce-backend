"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerPromoRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
const helpers_1 = require("../../utils/helpers");
const AppError_1 = require("../../utils/AppError");
const Promo_1 = require("../../models/Promo");
const envelope_1 = require("../../utils/envelope");
exports.customerPromoRouter = (0, express_1.Router)();
exports.customerPromoRouter.use(auth_1.requireAuth);
exports.customerPromoRouter.post("/promos/apply", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const code = String(req.body.code || "")
        .trim()
        .toUpperCase();
    const orderValue = Number(req.body.orderValue || 0);
    (0, helpers_1.requireText)(code, "Promo code is required");
    if (Number.isNaN(orderValue) || orderValue < 0) {
        throw new AppError_1.AppError(400, "Valid order value is required!");
    }
    const promo = await Promo_1.Promo.findOne({ code });
    if (!promo) {
        throw new AppError_1.AppError(404, "Promo not found");
    }
    const now = new Date();
    if (now < promo.startsAt) {
        throw new AppError_1.AppError(400, "Promo code is not activated");
    }
    if (now > promo.endsAt) {
        throw new AppError_1.AppError(400, "Promo code is expired");
    }
    if (promo.count < 1) {
        throw new AppError_1.AppError(400, "Promo code limit is already excedded");
    }
    if (orderValue < promo.minimumOrderValue) {
        throw new AppError_1.AppError(400, `Minimum order value for this promo is ${promo.minimumOrderValue}`);
    }
    res.json((0, envelope_1.ok)({
        code: promo.code,
        percentage: promo.percentage,
        count: promo.count,
        minimumOrderValue: promo.minimumOrderValue,
    }));
}));
