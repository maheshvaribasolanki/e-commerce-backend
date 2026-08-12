import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Banner } from "../../models/Banner.js";
import { Category } from "../../models/Category.js";
import { Product } from "../../models/Product.js";
import { Promo } from "../../models/Promo.js";
import { ok } from "../../utils/envelope.js";
export const customerHomeRouter = Router();
customerHomeRouter.get("/home", asyncHandler(async (_req, res) => {
    const now = new Date();
    const [banners, categories, recentProducts, promos] = await Promise.all([
        Banner.find().sort({ createdAt: -1 }).limit(6).lean(),
        Category.find().sort({ name: 1 }).lean(),
        Product.find({ status: "active" })
            .select("title brand price salePercentage images createdAt")
            .sort({ createdAt: -1 })
            .limit(4)
            .lean(),
        Promo.find({
            startsAt: { $lte: now },
            endsAt: { $gte: now },
            count: { $gt: 0 },
        })
            .sort({ createdAt: -1 })
            .limit(4)
            .lean(),
    ]);
    res.json(ok({
        banners: banners.map((bannerItem) => ({
            _id: String(bannerItem._id),
            imageUrl: bannerItem.imageUrl,
            createdAt: bannerItem.createdAt
                ? bannerItem.createdAt.toISOString()
                : new Date().toISOString(),
            createAt: bannerItem.createdAt
                ? bannerItem.createdAt.toISOString()
                : new Date().toISOString(),
        })),
        categories: categories.map((categoryItem) => ({
            _id: String(categoryItem._id),
            name: categoryItem.name,
        })),
        recentProducts: recentProducts.map((recentProductItem) => {
            const image = recentProductItem.images.find((item) => item.isCover)?.url ||
                recentProductItem.images[0]?.url ||
                "";
            const finalPrice = recentProductItem.salePercentage
                ? Math.round(recentProductItem.price -
                    (recentProductItem.price * recentProductItem.salePercentage) /
                        100)
                : recentProductItem.price;
            return {
                _id: String(recentProductItem._id),
                title: recentProductItem.title,
                brand: recentProductItem.brand,
                image,
                price: recentProductItem.price,
                finalPrice,
                salePercentage: recentProductItem.salePercentage,
                createdAt: recentProductItem.createdAt
                    ? recentProductItem.createdAt.toISOString()
                    : new Date().toISOString(),
                createAt: recentProductItem.createdAt
                    ? recentProductItem.createdAt.toISOString()
                    : new Date().toISOString(),
            };
        }),
        coupons: promos.map((promoItem) => ({
            _id: String(promoItem._id),
            code: promoItem.code,
            percentage: promoItem.percentage,
            count: promoItem.count,
            minimumOrderValue: promoItem.minimumOrderValue,
            endsAt: promoItem.endsAt.toISOString(),
        })),
    }));
}));
