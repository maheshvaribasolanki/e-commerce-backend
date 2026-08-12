import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { Category } from "../../models/Category.js";
import { ok } from "../../utils/envelope.js";
import { Product } from "../../models/Product.js";
import { requireFound } from "../../utils/helpers.js";
export const customerProductRouter = Router();
customerProductRouter.get("/categories", asyncHandler(async (_req, res) => {
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
}));
customerProductRouter.get("/products", asyncHandler(async (req, res) => {
    const category = (req.query.category || "").trim();
    const brand = (req.query.brand || "").trim();
    const color = (req.query.color || "").trim();
    const size = (req.query.size || "").trim();
    const sort = req.query.sort || "recent";
    const query = {
        status: "active",
    };
    if (category) {
        query.category = category;
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
    let sortOption = { createdAt: -1 };
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
}));
customerProductRouter.get("/products/:id", asyncHandler(async (req, res) => {
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
    res.json(ok({
        product: foundProduct,
        relatedProducts,
    }));
}));
