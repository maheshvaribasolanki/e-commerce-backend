"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerProductRouter = void 0;
const express_1 = require("express");
const asyncHandler_1 = require("../../utils/asyncHandler");
const Category_1 = require("../../models/Category");
const envelope_1 = require("../../utils/envelope");
const Product_1 = require("../../models/Product");
const helpers_1 = require("../../utils/helpers");
exports.customerProductRouter = (0, express_1.Router)();
exports.customerProductRouter.get("/categories", (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
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
        const exists = await Category_1.Category.findOne({ name });
        if (!exists) {
            await Category_1.Category.create({ name });
        }
    }
    const categories = await Category_1.Category.find({}).sort({ name: 1 });
    res.json((0, envelope_1.ok)(categories));
}));
exports.customerProductRouter.get("/products", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
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
    const products = await Product_1.Product.find(query)
        .populate("category", "name")
        .sort(sortOption);
    res.json((0, envelope_1.ok)(products));
}));
exports.customerProductRouter.get("/products/:id", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const productId = req.params.id;
    const product = await Product_1.Product.findOne({
        _id: productId,
        status: "active",
    }).populate("category", "name");
    const foundProduct = (0, helpers_1.requireFound)(product, "Product not found", 404);
    const relatedProducts = await Product_1.Product.find({
        _id: { $ne: foundProduct._id },
        category: foundProduct.category,
        status: "active",
    })
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .limit(4);
    res.json((0, envelope_1.ok)({
        product: foundProduct,
        relatedProducts,
    }));
}));
