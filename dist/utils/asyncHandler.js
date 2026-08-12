"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = asyncHandler;
function asyncHandler(func) {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    };
}
