"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = notFound;
const envelope_1 = require("../utils/envelope");
function notFound(req, res) {
    res.status(404).json((0, envelope_1.fail)(`Route not found ${req.method}`));
}
