"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
exports.requireAuth = requireAuth;
exports.getDbUserFromReq = getDbUserFromReq;
const express_1 = require("@clerk/express");
const AppError_1 = require("../utils/AppError");
const User_1 = require("../models/User");
const asyncHandler_1 = require("../utils/asyncHandler");
function requireAuth(req, _res, next) {
    const { userId } = (0, express_1.getAuth)(req);
    if (!userId) {
        return next(new AppError_1.AppError(401, "User is not logged in. Means unauth user! !"));
    }
    next();
}
async function getDbUserFromReq(req) {
    const { userId } = (0, express_1.getAuth)(req);
    if (!userId) {
        throw new AppError_1.AppError(401, "User is not logged in. Means unauth user! !");
    }
    const dbUser = await User_1.User.findOne({ clerkUserId: userId });
    if (!dbUser) {
        throw new AppError_1.AppError(404, "User is not found in the DB");
    }
    return dbUser;
}
// admin gate
//user logged in user + admin access
exports.requireAdmin = (0, asyncHandler_1.asyncHandler)(async (req, _res, next) => {
    const extractCurrentDbUser = await getDbUserFromReq(req);
    if (extractCurrentDbUser.role !== "admin") {
        throw new AppError_1.AppError(403, "Admin access only");
    }
    next();
});
