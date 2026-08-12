import { AppError } from "./AppError.js";
export function requireText(value, message, statusCode = 400) {
    if (!String(value || "").trim()) {
        throw new AppError(statusCode, message);
    }
}
export function requireNumber(value, message, statusCode = 400) {
    if (Number.isNaN(value)) {
        throw new AppError(statusCode, message);
    }
}
export function requireFound(value, message, statusCode = 404) {
    if (!value) {
        throw new AppError(statusCode, message);
    }
    return value;
}
