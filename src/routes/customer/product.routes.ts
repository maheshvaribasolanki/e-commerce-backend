import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Category } from "../../models/Category.js";
import { ok } from "../../utils/envelope.js";
import { Product } from "../../models/Product.js";
import { requireFound } from "../../utils/helpers.js";

export const customerProductRouter = Router();

type ProductSort = "recent" | "price-low" | "price-high";

type ProductAppliedFilterListQuery = {
  category?: string;
  brand?: string;
  color?: string;
  size?: string;
  sort?: ProductSort;
};

customerProductRouter.get(
  "/categories",

  asyncHandler(async (_req: Request, res: Response) => {
    const requiredCategories = [
      "Electronics",
      "Laptops",
      "Men",
      "Women",
      "Kids",
      "Clothing",
      "Footwear",
      "Accessories",
    ];

    for (const name of requiredCategories) {
      const exists = await Category.findOne({ name });
      if (!exists) {
        await Category.create({ name });
      }
    }

    const categories = await Category.find({}).sort({ name: 1 });
    res.json(ok(categories));
  }),
);

customerProductRouter.get(
  "/products",

  asyncHandler(
    async (
      req: Request<{}, {}, {}, ProductAppliedFilterListQuery>,
      res: Response,
    ) => {
      const categoryRaw = (req.query.category || "").trim();
      const brand = (req.query.brand || "").trim();
      const color = (req.query.color || "").trim();
      const size = (req.query.size || "").trim();
      const sort: ProductSort = req.query.sort || "recent";

      const query: Record<string, unknown> = {
        status: "active",
      };

      if (categoryRaw) {
        const rawCategoryList = categoryRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (rawCategoryList.length > 0) {
          const validObjectIds = rawCategoryList.filter((item) =>
            mongoose.Types.ObjectId.isValid(item),
          );

          const nameRegexes = rawCategoryList.map(
            (name) => new RegExp(`^${name}$`, "i"),
          );

          const matchedCategories = await Category.find({
            $or: [
              { _id: { $in: validObjectIds } },
              { name: { $in: nameRegexes } },
            ],
          });

          const matchedIds = Array.from(
            new Set([
              ...validObjectIds,
              ...matchedCategories.map((c) => c._id.toString()),
            ]),
          );

          if (matchedIds.length > 0) {
            query.category = { $in: matchedIds };
          } else {
            query.category = { $in: rawCategoryList };
          }
        }
      }

      if (brand) {
        query.brand = brand;
      }
      if (color) {
        query.colors = color;
      }
      if (size) {
        query.sizes = size;
      }

      let sortOption: Record<string, 1 | -1> = { createdAt: -1 };

      if (sort === "price-low") {
        sortOption = { price: 1 };
      }

      if (sort === "price-high") {
        sortOption = { price: -1 };
      }

      const products = await Product.find(query)
        .populate("category", "name")
        .sort(sortOption);

      res.json(ok(products));
    },
  ),
);

customerProductRouter.get(
  "/products/:id",

  asyncHandler(async (req: Request, res: Response) => {
    const productId = req.params.id;

    const product = await Product.findOne({
      _id: productId,
      status: "active",
    }).populate("category", "name");

    const foundProduct = requireFound(product, "Product not found", 404);

    const relatedProducts = await Product.find({
      _id: { $ne: foundProduct._id },
      category: foundProduct.category,
      status: "active",
    })
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .limit(4);

    res.json(
      ok({
        product: foundProduct,
        relatedProducts,
      }),
    );
  }),
);
