"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSettingsRouter = void 0;
const auth_1 = require("../../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const Banner_1 = require("../../models/Banner");
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const envelope_1 = require("../../utils/envelope");
const AppError_1 = require("../../utils/AppError");
const cloudinary_1 = require("../../utils/cloudinary");
const helpers_1 = require("../../utils/helpers");
function mapBanner(item) {
    return {
        _id: String(item._id),
        imageUrl: item.imageUrl,
        imagePublicId: item.imagePublicId,
        createdAt: item.createdAt.toISOString(),
    };
}
const BANNER_FOLDER = "ecommerce-monster-video/banners";
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fieldSize: 5 * 1024 * 1024,
        files: 10,
    },
});
exports.adminSettingsRouter = (0, express_1.Router)();
exports.adminSettingsRouter.use(auth_1.requireAdmin);
async function getAllBanners() {
    const items = await Banner_1.Banner.find().sort({ createdAt: -1 });
    return items.map(mapBanner);
}
exports.adminSettingsRouter.get("/settings/banners", (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
    res.json((0, envelope_1.ok)({
        items: await getAllBanners(),
    }));
}));
exports.adminSettingsRouter.post("/settings/banners", upload.array("images", 10), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const dbUser = await (0, auth_1.getDbUserFromReq)(req);
    const files = (req.files || []);
    const imageUrl = String(req.body.imageUrl || "").trim();
    if (imageUrl) {
        await Banner_1.Banner.create({
            imageUrl,
            imagePublicId: `sample_banner_${Date.now()}`,
            createdBy: dbUser._id,
        });
        res.json((0, envelope_1.ok)({
            items: await getAllBanners(),
        }));
        return;
    }
    if (!files.length) {
        throw new AppError_1.AppError(400, "At least one image file or image URL is required");
    }
    let bannerItems = [];
    try {
        const uploadedImages = await (0, cloudinary_1.uploadManyBuffersToCloudinary)(files.map((file) => file.buffer), BANNER_FOLDER);
        bannerItems = uploadedImages.map((item) => ({
            imageUrl: item.url,
            imagePublicId: item.publicId,
        }));
    }
    catch (uploadError) {
        console.error("Cloudinary upload failed, using fallback images:", uploadError);
        bannerItems = files.map((_, index) => ({
            imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80",
            imagePublicId: `banner_fallback_${Date.now()}_${index}`,
        }));
    }
    await Banner_1.Banner.insertMany(bannerItems.map((item) => ({
        imageUrl: item.imageUrl,
        imagePublicId: item.imagePublicId,
        createdBy: dbUser._id,
    })));
    res.json((0, envelope_1.ok)({
        items: await getAllBanners(),
    }));
}));
exports.adminSettingsRouter.put("/settings/banners/:id", upload.array("images", 1), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const bannerId = String(req.params.id || "").trim();
    (0, helpers_1.requireText)(bannerId, "Banner ID is required");
    const bannerDoc = await Banner_1.Banner.findById(bannerId);
    const banner = (0, helpers_1.requireFound)(bannerDoc, "Banner not found", 404);
    const imageUrl = String(req.body.imageUrl || "").trim();
    const files = (req.files || []);
    if (imageUrl) {
        banner.imageUrl = imageUrl;
    }
    else if (files.length) {
        try {
            const uploadedImages = await (0, cloudinary_1.uploadManyBuffersToCloudinary)(files.map((file) => file.buffer), BANNER_FOLDER);
            if (uploadedImages.length > 0) {
                banner.imageUrl = uploadedImages[0].url;
                banner.imagePublicId = uploadedImages[0].publicId;
            }
        }
        catch (uploadError) {
            console.error("Cloudinary upload failed:", uploadError);
            banner.imageUrl =
                "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80";
        }
    }
    await banner.save();
    res.json((0, envelope_1.ok)({
        items: await getAllBanners(),
    }));
}));
exports.adminSettingsRouter.delete("/settings/banners/:id", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const bannerId = String(req.params.id || "").trim();
    (0, helpers_1.requireText)(bannerId, "Banner ID is required");
    const banner = await Banner_1.Banner.findById(bannerId);
    (0, helpers_1.requireFound)(banner, "Banner not found", 404);
    await Banner_1.Banner.findByIdAndDelete(bannerId);
    res.json((0, envelope_1.ok)({
        items: await getAllBanners(),
    }));
}));
