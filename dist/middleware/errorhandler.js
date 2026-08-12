"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const AppError_1 = require("../utils/AppError");
const envelope_1 = require("../utils/envelope");
function errorHandler(err, _req, res, _next) {
    if (err instanceof AppError_1.AppError) {
        return res.status(err.statusCode).json((0, envelope_1.fail)(err.message, "APP_ERROR"));
    }
    console.error("error", err);
    return res.status(500).json((0, envelope_1.fail)("Internal server error", "INTERNAL"));
}
