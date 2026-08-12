import { getDbUserFromReq, requireAdmin } from "../../middleware/auth.js";
import multer from "multer";
import { Banner } from "../../models/Banner.js";
import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ok } from "../../utils/envelope.js";
import { AppError } from "../../utils/AppError.js";
import { uploadManyBuffersToCloudinary } from "../../utils/cloudinary.js";
import { requireFound, requireText } from "../../utils/helpers.js";
function mapBanner(item) {
    return {
        _id: String(item._id),
        imageUrl: item.imageUrl,
        imagePublicId: item.imagePublicId,
        createdAt: item.createdAt.toISOString(),
    };
}
const BANNER_FOLDER = "ecommerce-monster-video/banners";
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fieldSize: 5 * 1024 * 1024,
        files: 10,
    },
});
export const adminSettingsRouter = Router();
adminSettingsRouter.use(requireAdmin);
async function getAllBanners() {
    const items = await Banner.find().sort({ createdAt: -1 });
    return items.map(mapBanner);
}
adminSettingsRouter.get("/settings/banners", asyncHandler(async (_req, res) => {
    res.json(ok({
        items: await getAllBanners(),
    }));
}));
adminSettingsRouter.post("/settings/banners", upload.array("images", 10), asyncHandler(async (req, res) => {
    const dbUser = await getDbUserFromReq(req);
    const files = (req.files || []);
    const imageUrl = String(req.body.imageUrl || "").trim();
    if (imageUrl) {
        await Banner.create({
            imageUrl,
            imagePublicId: `sample_banner_${Date.now()}`,
            createdBy: dbUser._id,
        });
        res.json(ok({
            items: await getAllBanners(),
        }));
        return;
    }
    if (!files.length) {
        throw new AppError(400, "At least one image file or image URL is required");
    }
    let bannerItems = [];
    try {
        const uploadedImages = await uploadManyBuffersToCloudinary(files.map((file) => file.buffer), BANNER_FOLDER);
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
    await Banner.insertMany(bannerItems.map((item) => ({
        imageUrl: item.imageUrl,
        imagePublicId: item.imagePublicId,
        createdBy: dbUser._id,
    })));
    res.json(ok({
        items: await getAllBanners(),
    }));
}));
adminSettingsRouter.put("/settings/banners/:id", upload.array("images", 1), asyncHandler(async (req, res) => {
    const bannerId = String(req.params.id || "").trim();
    requireText(bannerId, "Banner ID is required");
    const bannerDoc = await Banner.findById(bannerId);
    const banner = requireFound(bannerDoc, "Banner not found", 404);
    const imageUrl = String(req.body.imageUrl || "").trim();
    const files = (req.files || []);
    if (imageUrl) {
        banner.imageUrl = imageUrl;
    }
    else if (files.length) {
        try {
            const uploadedImages = await uploadManyBuffersToCloudinary(files.map((file) => file.buffer), BANNER_FOLDER);
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
    res.json(ok({
        items: await getAllBanners(),
    }));
}));
adminSettingsRouter.delete("/settings/banners/:id", asyncHandler(async (req, res) => {
    const bannerId = String(req.params.id || "").trim();
    requireText(bannerId, "Banner ID is required");
    const banner = await Banner.findById(bannerId);
    requireFound(banner, "Banner not found", 404);
    await Banner.findByIdAndDelete(bannerId);
    res.json(ok({
        items: await getAllBanners(),
    }));
}));
