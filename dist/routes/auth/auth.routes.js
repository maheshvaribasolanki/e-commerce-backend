"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middleware/auth");
const asyncHandler_1 = require("../../utils/asyncHandler");
const express_2 = require("@clerk/express");
const AppError_1 = require("../../utils/AppError");
const User_1 = require("../../models/User");
const envelope_1 = require("../../utils/envelope");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/sync", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = (0, express_2.getAuth)(req);
    if (!userId) {
        throw new AppError_1.AppError(401, "User is not logged in. Means unauth user! !");
    }
    const clerkUser = await express_2.clerkClient.users.getUser(userId);
    const extractEmailFromUserInfo = clerkUser.emailAddresses.find((item) => item.id === clerkUser.primaryEmailAddressId) || clerkUser.emailAddresses[0];
    const email = extractEmailFromUserInfo.emailAddress;
    const fullName = [clerkUser.firstName, clerkUser.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
    const name = fullName || clerkUser.username;
    const raw = process.env.ADMIN_EMAILS || "";
    const adminEmails = new Set(raw
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean));
    // if the current user is existing user or not
    // update/do nothing
    // create the user and save in our db with
    // role
    const existingUser = await User_1.User.findOne({ clerkUserId: userId });
    const shouldBeAdmin = email ? adminEmails.has(email.toLowerCase()) : false;
    const nextRole = existingUser?.role === "admin"
        ? "admin"
        : shouldBeAdmin
            ? "admin"
            : existingUser?.role || "user";
    const newlyCreatedDbUser = await User_1.User.findOneAndUpdate({
        clerkUserId: userId,
    }, {
        clerkUserId: userId,
        email,
        name,
        role: nextRole,
    }, {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
    });
    res.status(200).json((0, envelope_1.ok)({
        user: {
            id: newlyCreatedDbUser._id,
            clerkUserId: newlyCreatedDbUser.clerkUserId,
            email: newlyCreatedDbUser.email,
            name: newlyCreatedDbUser.name,
            role: newlyCreatedDbUser.role,
        },
    }));
}));
exports.authRouter.get("/me", auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { userId } = (0, express_2.getAuth)(req);
    if (!userId) {
        throw new AppError_1.AppError(401, "User is not logged in. Means unauth user! !");
    }
    const dbUser = await User_1.User.findOne({ clerkUserId: userId });
    if (!dbUser) {
        throw new AppError_1.AppError(404, "User is not found in DB");
    }
    res.status(200).json((0, envelope_1.ok)({
        user: {
            id: dbUser._id,
            clerkUserId: dbUser.clerkUserId,
            email: dbUser.email,
            name: dbUser.name,
            role: dbUser.role,
        },
    }));
}));
