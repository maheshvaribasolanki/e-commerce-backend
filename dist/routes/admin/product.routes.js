"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminProductRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../../middleware/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
const Category_1 = require("../../models/Category");
const envelope_1 = require("../../utils/envelope");
const helpers_1 = require("../../utils/helpers");
const Product_1 = require("../../models/Product");
const cloudinary_1 = require("../../utils/cloudinary");
exports.adminProductRouter = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fieldSize: 5 * 1024 * 1024,
        files: 10,
    },
});
exports.adminProductRouter.use(auth_1.requireAdmin);
// categories
exports.adminProductRouter.get("/categories", (0, asyncHandler_1.asyncHandler)(async (_req, res) => {
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
exports.adminProductRouter.post("/categories", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const name = String(req.body.name || "").trim();
    (0, helpers_1.requireText)(name, "Category name is needed");
    const category = await Category_1.Category.create({ name });
    res.status(201).json((0, envelope_1.ok)(category));
}));
exports.adminProductRouter.put("/categories/:id", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const name = String(req.body.name || "").trim();
    const extractCategoryId = req.params.id;
    (0, helpers_1.requireText)(name, "Category name is needed");
    const existingCategory = await Category_1.Category.findById(extractCategoryId);
    const category = (0, helpers_1.requireFound)(existingCategory, "Category not found");
    category.name = name;
    await category.save();
    res.json((0, envelope_1.ok)(category));
}));
// products
exports.adminProductRouter.get("/products", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const search = String(req.query.search || "").trim();
    const query = {};
    if (search) {
        query.title = { $regex: search, $options: "i" };
    }
    const products = await Product_1.Product.find(query)
        .populate("category", "name")
        .sort({ createdAt: -1 });
    res.json((0, envelope_1.ok)(products));
}));
exports.adminProductRouter.get("/products/:id", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const productId = req.params.id;
    const product = await Product_1.Product.findById(productId).populate("category", "name");
    (0, helpers_1.requireText)(product, "Product not found", 404);
    res.json((0, envelope_1.ok)(product));
}));
exports.adminProductRouter.post("/products", upload.array("images", 10), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    const category = String(req.body.category || "").trim();
    const brand = String(req.body.brand || "").trim();
    const price = Number(req.body.price);
    const salePercentage = Number(req.body.salePercentage || 0);
    const stock = Number(req.body.stock);
    const status = String(req.body.status || "active").trim();
    const colors = req.body.colors || [];
    const sizes = req.body.sizes || [];
    (0, helpers_1.requireText)(title, "Title is required");
    (0, helpers_1.requireText)(description, "Description is required");
    (0, helpers_1.requireText)(category, "Category is required");
    (0, helpers_1.requireText)(brand, "Brand is required");
    (0, helpers_1.requireNumber)(price, "Price is required");
    (0, helpers_1.requireNumber)(salePercentage, "Sale Percentage is required");
    (0, helpers_1.requireNumber)(stock, "Stock is required");
    const existingCategory = await Category_1.Category.findById(category);
    (0, helpers_1.requireText)(existingCategory, "Category not found", 404);
    const files = req.files || [];
    let images = [];
    if (files.length) {
        try {
            const uploadedImages = await (0, cloudinary_1.uploadManyBuffersToCloudinary)(files.map((file) => file.buffer));
            images = uploadedImages.map((img, index) => ({
                url: img.url,
                publicId: img.publicId,
                isCover: index === 0,
            }));
        }
        catch (uploadError) {
            console.error("Cloudinary upload failed, using fallback image:", uploadError);
            images = [
                {
                    url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
                    publicId: `default_placeholder_${Date.now()}`,
                    isCover: true,
                },
            ];
        }
    }
    else {
        images = [
            {
                url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
                publicId: `default_placeholder_${Date.now()}`,
                isCover: true,
            },
        ];
    }
    const user = await (0, auth_1.getDbUserFromReq)(req);
    const product = await Product_1.Product.create({
        title,
        description,
        category,
        brand,
        images,
        colors,
        sizes,
        price,
        salePercentage,
        stock,
        status,
        createdBy: user._id,
    });
    const createdProduct = await Product_1.Product.findById(product._id).populate("category", "name");
    res.status(201).json((0, envelope_1.ok)(createdProduct));
}));
exports.adminProductRouter.put("/products/:id", upload.array("images", 10), (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const productId = req.params.id;
    const title = String(req.body.title || "").trim();
    const description = String(req.body.description || "").trim();
    const category = String(req.body.category || "").trim();
    const brand = String(req.body.brand || "").trim();
    const price = Number(req.body.price);
    const salePercentage = Number(req.body.salePercentage || 0);
    const stock = Number(req.body.stock);
    const status = String(req.body.status || "active").trim();
    const colors = req.body.colors || [];
    const sizes = req.body.sizes || [];
    const coverImagePublicId = String(req.body.coverImagePublicId || "").trim();
    (0, helpers_1.requireText)(title, "Title is required");
    (0, helpers_1.requireText)(description, "Description is required");
    (0, helpers_1.requireText)(category, "Category is required");
    (0, helpers_1.requireText)(brand, "Brand is required");
    (0, helpers_1.requireNumber)(price, "Price is required");
    (0, helpers_1.requireNumber)(salePercentage, "Sale Percentage is required");
    (0, helpers_1.requireNumber)(stock, "Stock is required");
    const existingCategoryDoc = await Category_1.Category.findById(category);
    const existingCategory = (0, helpers_1.requireFound)(existingCategoryDoc, "Category not found");
    const productDoc = await Product_1.Product.findById(productId);
    const product = (0, helpers_1.requireFound)(productDoc, "Product not found");
    const files = req.files || [];
    const uploadNewImages = await (0, cloudinary_1.uploadManyBuffersToCloudinary)(files.map((file) => file.buffer));
    const newlyAddedImages = uploadNewImages.map((image) => ({
        url: image.url,
        publicId: image.publicId,
        isCover: false,
    }));
    let existingImages = product.images.map((img) => ({
        url: img.url,
        publicId: img.publicId,
        isCover: img.isCover,
    }));
    const mergedImages = [
        ...existingImages,
        ...newlyAddedImages,
    ];
    if (!mergedImages.length) {
        mergedImages.push({
            url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
            publicId: `default_placeholder_${Date.now()}`,
            isCover: true,
        });
    }
    const finalImages = mergedImages.map((image, index) => ({
        url: image.url,
        publicId: image.publicId,
        isCover: coverImagePublicId
            ? image.publicId === coverImagePublicId
            : index === 0,
    }));
    product.title = title;
    product.description = description;
    product.category = existingCategory._id;
    product.brand = brand;
    product.colors = colors;
    product.sizes = sizes;
    product.price = price;
    product.salePercentage = salePercentage;
    product.stock = stock;
    product.status = status;
    product.set("images", finalImages);
    await product.save();
    const updatedProduct = await Product_1.Product.findById(product._id).populate("category", "name");
    res.json((0, envelope_1.ok)(updatedProduct));
}));
