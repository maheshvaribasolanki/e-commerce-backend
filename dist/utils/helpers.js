"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireText = requireText;
exports.requireNumber = requireNumber;
exports.requireFound = requireFound;
const AppError_1 = require("./AppError");
function requireText(value, message, statusCode = 400) {
    if (!String(value || "").trim()) {
        throw new AppError_1.AppError(statusCode, message);
    }
}
function requireNumber(value, message, statusCode = 400) {
    if (Number.isNaN(value)) {
        throw new AppError_1.AppError(statusCode, message);
    }
}
function requireFound(value, message, statusCode = 404) {
    if (!value) {
        throw new AppError_1.AppError(statusCode, message);
    }
    return value;
}
