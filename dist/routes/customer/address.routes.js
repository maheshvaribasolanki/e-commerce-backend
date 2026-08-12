"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerAddressRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
const User_1 = require("../../models/User");
const helpers_1 = require("../../utils/helpers");
const envelope_1 = require("../../utils/envelope");
const AppError_1 = require("../../utils/AppError");
function mapAddress(item) {
    return {
        _id: String(item._id || ""),
        fullName: item.fullName,
        address: item.address,
        state: item.state,
        postalCode: item.postalCode,
        isDefault: item.isDefault,
    };
}
exports.customerAddressRouter = (0, express_1.Router)();
exports.customerAddressRouter.use(auth_1.requireAuth);
exports.customerAddressRouter.get("/addresses", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const dbUser = await (0, auth_1.getDbUserFromReq)(req);
    const user = await User_1.User.findById(dbUser._id);
    const foundUser = (0, helpers_1.requireFound)(user, "User not found", 404);
    const addresses = (foundUser.addresses || []);
    const items = [...addresses]
        .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
        .map(mapAddress);
    res.json((0, envelope_1.ok)({ items }));
}));
exports.customerAddressRouter.post("/addresses", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const dbUser = await (0, auth_1.getDbUserFromReq)(req);
    const fullName = String(req.body.fullName || "").trim();
    const address = String(req.body.address || "").trim();
    const state = String(req.body.state || "").trim();
    const postalCode = String(req.body.postalCode || "").trim();
    (0, helpers_1.requireText)(fullName, "Full name is required");
    (0, helpers_1.requireText)(address, "Address is required");
    (0, helpers_1.requireText)(state, "State is required");
    (0, helpers_1.requireText)(postalCode, "postal code is required");
    const user = await User_1.User.findById(dbUser._id);
    const foundUser = (0, helpers_1.requireFound)(user, "User not found", 404);
    const addresses = (foundUser.addresses || []);
    const shouldMarkAsDefault = req.body.isDefault === true || addresses.length === 0;
    if (shouldMarkAsDefault) {
        addresses.forEach((item) => {
            item.isDefault = false;
        });
    }
    addresses.push({
        fullName,
        address,
        state,
        postalCode,
        isDefault: shouldMarkAsDefault,
    });
    await foundUser.save();
    const items = [...addresses]
        .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
        .map(mapAddress);
    res.json((0, envelope_1.ok)({ items }));
}));
exports.customerAddressRouter.patch("/addresses/:addressId", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const dbUser = await (0, auth_1.getDbUserFromReq)(req);
    const addressId = String(req.params.addressId || "").trim();
    (0, helpers_1.requireText)(addressId, "Address id is required");
    const fullName = String(req.body.fullName || "").trim();
    const address = String(req.body.address || "").trim();
    const state = String(req.body.state || "").trim();
    const postalCode = String(req.body.postalCode || "").trim();
    (0, helpers_1.requireText)(fullName, "Full name is required");
    (0, helpers_1.requireText)(address, "Address is required");
    (0, helpers_1.requireText)(state, "State is required");
    (0, helpers_1.requireText)(postalCode, "postal code is required");
    const user = await User_1.User.findById(dbUser._id);
    const foundUser = (0, helpers_1.requireFound)(user, "User not found", 404);
    const addresses = (foundUser.addresses || []);
    const getAddressTheUserWantToEdit = addresses.find((currentAddress) => String(currentAddress._id) === addressId);
    if (!getAddressTheUserWantToEdit) {
        throw new AppError_1.AppError(404, "Address not found");
    }
    const shouldMarkAsDefault = req.body.isDefault === true || addresses.length === 0;
    if (shouldMarkAsDefault) {
        addresses.forEach((item) => {
            item.isDefault = false;
        });
    }
    getAddressTheUserWantToEdit.fullName = fullName;
    getAddressTheUserWantToEdit.address = address;
    getAddressTheUserWantToEdit.state = state;
    getAddressTheUserWantToEdit.postalCode = postalCode;
    if (shouldMarkAsDefault) {
        getAddressTheUserWantToEdit.isDefault = true;
    }
    await foundUser.save();
    const items = [...foundUser.addresses]
        .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
        .map(mapAddress);
    res.json((0, envelope_1.ok)({ items }));
}));
exports.customerAddressRouter.delete("/addresses/:addressId", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const dbUser = await (0, auth_1.getDbUserFromReq)(req);
    const addressId = String(req.params.addressId || "").trim();
    (0, helpers_1.requireText)(addressId, "Address id is required");
    const user = await User_1.User.findById(dbUser._id);
    const foundUser = (0, helpers_1.requireFound)(user, "User not found", 404);
    const addresses = (foundUser.addresses || []);
    const addressToBeDeletedIndex = addresses.findIndex((currentAddress) => String(currentAddress._id) === addressId);
    if (addressToBeDeletedIndex < 0) {
        throw new AppError_1.AppError(404, "Address not found");
    }
    const wasDefault = addresses[addressToBeDeletedIndex].isDefault;
    addresses.splice(addressToBeDeletedIndex, 1);
    if (wasDefault &&
        addresses.length > 0 &&
        !addresses.some((address) => address.isDefault)) {
        addresses[0].isDefault = true;
    }
    await foundUser.save();
    const items = [...foundUser.addresses]
        .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
        .map(mapAddress);
    res.json((0, envelope_1.ok)({ items }));
}));
