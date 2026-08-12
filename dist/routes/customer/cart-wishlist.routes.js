"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerCartWishlistRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const Product_1 = require("../../models/Product");
const asyncHandler_1 = require("../../utils/asyncHandler");
const envelope_1 = require("../../utils/envelope");
const Cart_1 = require("../../models/Cart");
const helpers_1 = require("../../utils/helpers");
const AppError_1 = require("../../utils/AppError");
const Wishlist_1 = require("../../models/Wishlist");
exports.customerCartWishlistRouter = (0, express_1.Router)();
function formatProduct(product) {
    const image = product.images.find((item) => item.isCover)?.url ||
        product.images[0]?.url ||
        "";
    const finalPrice = product.salePercentage
        ? Math.round(product.price - (product.price * product.salePercentage) / 100)
        : product.price;
    return {
        productId: String(product._id),
        title: product.title,
        brand: product.brand,
        image,
        finalPrice,
    };
}
async function getCartResponse(userId) {
    const cart = await Cart_1.Cart.findOne({ user: userId }).populate("items.product", "title brand price salePercentage images");
    const cartItems = (cart?.items || []);
    const items = cartItems.flatMap((cartItem) => {
        if (!cartItem.product)
            return [];
        return [
            {
                ...formatProduct(cartItem.product),
                quantity: cartItem.quantity,
                color: cartItem.color,
                size: cartItem.size,
            },
        ];
    });
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    return {
        items,
        totalQuantity,
    };
}
async function getWishlistResponse(userId) {
    const wishlist = await Wishlist_1.Wishlist.findOne({ user: userId }).populate("products", "title brand price salepercentage images");
    const products = (wishlist?.products || []);
    const items = products.flatMap((productItem) => {
        if (!productItem)
            return [];
        return [formatProduct(productItem)];
    });
    return { items };
}
function getSelectedvariant(product, colorValue, sizeValue) {
    let color;
    let size;
    if (product.colors && product.colors.length > 0) {
        color = product.colors.includes(colorValue)
            ? colorValue
            : product.colors[0];
    }
    if (product.sizes && product.sizes.length > 0) {
        size = product.sizes.includes(sizeValue)
            ? sizeValue
            : product.sizes[0];
    }
    return { color, size };
}
function normalizeColor(color) {
    if (!color)
        return "";
    return decodeURIComponent(color).replace("#", "").toLowerCase().trim();
}
function getItemProductId(productRef) {
    if (!productRef)
        return "";
    if (typeof productRef === "string")
        return productRef;
    if (productRef._id)
        return String(productRef._id);
    return String(productRef);
}
function isSameCartItem(item, productId, color, size) {
    const itemProdId = getItemProductId(item.product);
    const sameProd = itemProdId === productId;
    const sameColor = normalizeColor(item.color) === normalizeColor(color);
    const sameSize = (item.size || "").toLowerCase().trim() === (size || "").toLowerCase().trim();
    return sameProd && sameColor && sameSize;
}
exports.customerCartWishlistRouter.use(auth_1.requireAuth);
exports.customerCartWishlistRouter.get("/cart", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const dbUser = await (0, auth_1.getDbUserFromReq)(req);
    res.json((0, envelope_1.ok)(await getCartResponse(String(dbUser._id))));
}));
exports.customerCartWishlistRouter.post("/cart/items", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const dbUser = await (0, auth_1.getDbUserFromReq)(req);
    const productId = String(req.body.productId || "").trim();
    const quantity = Number(req.body.quantity || 1);
    const colorValue = String(req.body.color || "").trim();
    const sizeValue = String(req.body.size || "").trim();
    (0, helpers_1.requireText)(productId, "Product id is required");
    if (Number.isNaN(quantity) || quantity < 1) {
        throw new AppError_1.AppError(400, "Quantity must be at least 1");
    }
    const product = await Product_1.Product.findOne({
        _id: productId,
    });
    const foundProduct = (0, helpers_1.requireFound)(product, "Product not found", 404);
    const { color, size } = getSelectedvariant(foundProduct, colorValue, sizeValue);
    if (quantity > foundProduct.stock) {
        throw new AppError_1.AppError(400, "Quantity is more than the stock of this product");
    }
    let cart = await Cart_1.Cart.findOne({ user: dbUser._id });
    if (!cart) {
        cart = await Cart_1.Cart.create({
            user: dbUser._id,
            items: [],
        });
    }
    const itemIndex = cart.items.findIndex((item) => isSameCartItem(item, String(foundProduct._id), color, size));
    if (itemIndex >= 0) {
        const nextQuantity = cart.items[itemIndex].quantity + quantity;
        if (nextQuantity > foundProduct.stock) {
            throw new AppError_1.AppError(400, "Quantity is more than the stock of this product");
        }
        cart.items[itemIndex].quantity = nextQuantity;
    }
    else {
        cart.items.push({
            product: foundProduct._id,
            quantity,
            color,
            size,
        });
    }
    cart.markModified("items");
    await cart.save();
    res.json((0, envelope_1.ok)(await getCartResponse(String(dbUser._id))));
}));
exports.customerCartWishlistRouter.patch("/cart/items/:productId/increase", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const dbUser = await (0, auth_1.getDbUserFromReq)(req);
    const productId = String(req.params.productId || "").trim();
    const colorValue = String(req.query.color || "").trim();
    const sizeValue = String(req.query.size || "").trim();
    (0, helpers_1.requireText)(productId, "Product id is required");
    const cart = await Cart_1.Cart.findOne({ user: dbUser._id });
    const foundCart = (0, helpers_1.requireFound)(cart, "Cart not found", 404);
    const product = await Product_1.Product.findOne({
        _id: productId,
    });
    const foundProduct = (0, helpers_1.requireFound)(product, "Product not found", 404);
    const { color, size } = getSelectedvariant(foundProduct, colorValue, sizeValue);
    const itemIndex = cart.items.findIndex((item) => isSameCartItem(item, String(foundProduct._id), color, size));
    if (itemIndex < 0) {
        throw new AppError_1.AppError(400, "Cart item not found here");
    }
    if (foundCart.items[itemIndex].quantity + 1 > foundProduct.stock) {
        throw new AppError_1.AppError(400, "Quantity is more than the stock of this product");
    }
    foundCart.items[itemIndex].quantity += 1;
    await foundCart.save();
    res.json((0, envelope_1.ok)(await getCartResponse(String(dbUser._id))));
}));
exports.customerCartWishlistRouter.patch("/cart/items/:productId/decrease", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const dbUser = await (0, auth_1.getDbUserFromReq)(req);
    const productId = String(req.params.productId || "").trim();
    const colorValue = String(req.query.color || "").trim();
    const sizeValue = String(req.query.size || "").trim();
    (0, helpers_1.requireText)(productId, "Product id is required");
    const cart = await Cart_1.Cart.findOne({ user: dbUser._id });
    const foundCart = (0, helpers_1.requireFound)(cart, "Cart not found", 404);
    const product = await Product_1.Product.findOne({
        _id: productId,
    });
    const foundProduct = (0, helpers_1.requireFound)(product, "Product not found", 404);
    const { color, size } = getSelectedvariant(foundProduct, colorValue, sizeValue);
    const itemIndex = cart.items.findIndex((item) => isSameCartItem(item, String(foundProduct._id), color, size));
    if (itemIndex < 0) {
        throw new AppError_1.AppError(400, "Cart item not found here");
    }
    foundCart.items[itemIndex].quantity -= 1;
    if (foundCart.items[itemIndex].quantity <= 0) {
        foundCart.items.splice(itemIndex, 1);
    }
    await foundCart.save();
    res.json((0, envelope_1.ok)(await getCartResponse(String(dbUser._id))));
}));
exports.customerCartWishlistRouter.delete("/cart/items/:productId", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const dbUser = await (0, auth_1.getDbUserFromReq)(req);
    const productId = String(req.params.productId || "").trim();
    const colorValue = String(req.query.color || "").trim();
    const sizeValue = String(req.query.size || "").trim();
    (0, helpers_1.requireText)(productId, "Product id is required");
    const cart = await Cart_1.Cart.findOne({ user: dbUser._id });
    if (!cart) {
        res.json((0, envelope_1.ok)({ items: [], totalQuantity: 0 }));
        return;
    }
    const product = await Product_1.Product.findOne({
        _id: productId,
    });
    const foundProduct = (0, helpers_1.requireFound)(product, "Product not found", 404);
    const { color, size } = getSelectedvariant(foundProduct, colorValue, sizeValue);
    cart.items = cart.items.filter((item) => !isSameCartItem(item, productId, color, size));
    await cart.save();
    res.json((0, envelope_1.ok)(await getCartResponse(String(dbUser._id))));
}));
exports.customerCartWishlistRouter.post("/cart/sync", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const dbUser = await (0, auth_1.getDbUserFromReq)(req);
    const incomingItems = Array.isArray(req.body.items)
        ? req.body.items
        : [];
    let cart = await Cart_1.Cart.findOne({ user: dbUser._id });
    if (!cart) {
        cart = await Cart_1.Cart.create({
            user: dbUser._id,
            items: [],
        });
    }
    for (const rawItem of incomingItems) {
        const productId = String(rawItem.productId || "").trim();
        const quantity = Number(rawItem.quantity || 0);
        const colorValue = String(rawItem.color || "").trim();
        const sizeValue = String(rawItem.size || "").trim();
        if (!productId || Number.isNaN(quantity) || quantity < 1) {
            continue;
        }
        const product = await Product_1.Product.findOne({
            _id: productId,
        });
        if (!product || product.stock < 1) {
            continue;
        }
        try {
            const { color, size } = getSelectedvariant(product, colorValue, sizeValue);
            const itemIndex = cart.items.findIndex((item) => isSameCartItem(item, String(product._id), color, size));
            if (itemIndex >= 0) {
                const nextQuantity = cart.items[itemIndex].quantity + quantity;
                cart.items[itemIndex].quantity = Math.min(nextQuantity, product.stock);
            }
            else {
                cart.items.push({
                    product: product._id,
                    quantity: Math.min(quantity, product.stock),
                    color,
                    size,
                });
            }
        }
        catch {
            continue;
        }
    }
    await cart.save();
    res.json((0, envelope_1.ok)(await getCartResponse(String(dbUser._id))));
}));
exports.customerCartWishlistRouter.get("/wishlist", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const dbUser = await (0, auth_1.getDbUserFromReq)(req);
    res.json((0, envelope_1.ok)(await getWishlistResponse(String(dbUser._id))));
}));
exports.customerCartWishlistRouter.post("/wishlist/items", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const dbUser = await (0, auth_1.getDbUserFromReq)(req);
    const productId = String(req.body.productId || "").trim();
    (0, helpers_1.requireText)(productId, "Product id is required");
    const product = await Product_1.Product.findOne({
        _id: productId,
        status: "active",
    });
    const foundProduct = (0, helpers_1.requireFound)(product, "Product not found", 404);
    let wishlist = await Wishlist_1.Wishlist.findOne({ user: dbUser._id });
    if (!wishlist) {
        wishlist = await Wishlist_1.Wishlist.create({
            user: dbUser._id,
            products: [],
        });
    }
    const exists = wishlist.products.some((item) => String(item) === String(foundProduct._id));
    if (!exists) {
        wishlist.products.push(foundProduct._id);
        await wishlist.save();
    }
    res.json((0, envelope_1.ok)(await getWishlistResponse(String(dbUser._id))));
}));
exports.customerCartWishlistRouter.delete("/wishlist/items/:productId", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const dbUser = await (0, auth_1.getDbUserFromReq)(req);
    const productId = String(req.params.productId || "").trim();
    (0, helpers_1.requireText)(productId, "Product id is required");
    let wishlist = await Wishlist_1.Wishlist.findOne({ user: dbUser._id });
    if (!wishlist) {
        res.json((0, envelope_1.ok)({ items: [] }));
        return;
    }
    wishlist.products = wishlist.products.filter((item) => String(item) !== productId);
    await wishlist.save();
    res.json((0, envelope_1.ok)(await getWishlistResponse(String(dbUser._id))));
}));
