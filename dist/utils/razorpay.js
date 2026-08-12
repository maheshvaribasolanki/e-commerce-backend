"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpay = void 0;
exports.toSubUnits = toSubUnits;
const razorpay_1 = __importDefault(require("razorpay"));
function checkEnv(name) {
    const extractValue = process.env[name];
    if (!extractValue) {
        throw new Error(`Missing env: ${name}`);
    }
    return extractValue;
}
exports.razorpay = new razorpay_1.default({
    key_id: checkEnv("RAZORPAY_KEY_ID"),
    key_secret: checkEnv("RAZORPAY_KEY_SECRET"),
});
function toSubUnits(amount) {
    return Math.round(amount * 100);
}
