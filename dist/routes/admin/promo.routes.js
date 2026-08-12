"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPromoRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
const Promo_1 = require("../../models/Promo");
const envelope_1 = require("../../utils/envelope");
const helpers_1 = require("../../utils/helpers");
const AppError_1 = require("../../utils/AppError");
function mapPromo(item) {
    return {
        _id: String(item._id || ""),
        code: item.code,
        percentage: item.percentage,
        count: item.count,
        minimumOrderValue: item.minimumOrderValue,
        startsAt: item.startsAt,
        endsAt: item.endsAt,
        createdAt: item.createdAt,
    };
}
exports.adminPromoRouter = (0, express_1.Router)();
exports.adminPromoRouter.use(auth_1.requireAdmin);
function parsePromoPayload(req) {
    const code = String(req.body.code || "")
        .trim()
        .toUpperCase();
    const percentage = Number(req.body.percentage);
    const count = Number(req.body.count);
    const minimumOrderValue = Number(req.body.minimumOrderValue);
    const startsAt = new Date(req.body.startsAt);
    const endsAt = new Date(req.body.endsAt);
    (0, helpers_1.requireText)(code, "promo code is required");
    if (Number.isNaN(percentage) || percentage < 1 || percentage > 100) {
        throw new AppError_1.AppError(400, "Percentage must be between 1 and 100");
    }
    if (!Number.isInteger(count) || count < 1) {
        throw new AppError_1.AppError(400, "Promo count must be at least 1");
    }
    if (Number.isNaN(minimumOrderValue) || minimumOrderValue < 0) {
        throw new AppError_1.AppError(400, "Minimum order value must be 0 or more");
    }
    if (Number.isNaN(startsAt.getTime())) {
        throw new AppError_1.AppError(400, "Valid start time is required");
    }
    if (Number.isNaN(endsAt.getTime())) {
        throw new AppError_1.AppError(400, "Valid end time is required");
    }
    if (endsAt <= startsAt) {
        throw new AppError_1.AppError(400, "End time should be after start time");
    }
    return {
        code,
        percentage,
        count,
        minimumOrderValue,
        startsAt,
        endsAt,
    };
}
async function getAllPromos() {
    const promos = await Promo_1.Promo.find().sort({ createdAt: -1 });
    return promos.map((item) => mapPromo(item.toObject()));
}
exports.adminPromoRouter.get("/promos", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    res.json((0, envelope_1.ok)({
        items: await getAllPromos(),
    }));
}));
exports.adminPromoRouter.post("/promos", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const payload = parsePromoPayload(req);
    const existingPromo = await Promo_1.Promo.findOne({ code: payload.code });
    if (existingPromo) {
        throw new AppError_1.AppError(400, "Promo code already exists");
    }
    await Promo_1.Promo.create(payload);
    res.json((0, envelope_1.ok)({
        items: await getAllPromos(),
    }));
}));
exports.adminPromoRouter.patch("/promos/:promoId", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const promoId = String(req.params.promoId || "").trim();
    (0, helpers_1.requireText)(promoId, "Promo Id is needed here");
    const payload = parsePromoPayload(req);
    const promo = await Promo_1.Promo.findById(promoId);
    const foundPromo = (0, helpers_1.requireFound)(promo, "Promo not found", 404);
    const existingPromo = await Promo_1.Promo.findOne({
        code: payload.code,
        _id: { $ne: foundPromo._id },
    });
    if (existingPromo) {
        throw new AppError_1.AppError(400, "Promo code already exists");
    }
    foundPromo.code = payload.code;
    foundPromo.percentage = payload.percentage;
    foundPromo.count = payload.count;
    foundPromo.minimumOrderValue = payload.minimumOrderValue;
    foundPromo.startsAt = payload.startsAt;
    foundPromo.endsAt = payload.endsAt;
    await foundPromo.save();
    res.json((0, envelope_1.ok)({
        items: await getAllPromos(),
    }));
}));
exports.adminPromoRouter.delete("/promos/:promoId", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const promoId = String(req.params.promoId || "").trim();
    (0, helpers_1.requireText)(promoId, "Promo Id is needed here");
    const promo = await Promo_1.Promo.findById(promoId);
    (0, helpers_1.requireFound)(promo, "Promo not found", 404);
    await Promo_1.Promo.findByIdAndDelete(promoId);
    res.json((0, envelope_1.ok)({
        items: await getAllPromos(),
    }));
}));
