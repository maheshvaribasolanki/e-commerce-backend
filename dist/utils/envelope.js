"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.fail = fail;
function ok(data, meta) {
    return { status: "success", data, meta };
}
function fail(message, code) {
    return { status: "error", data: null, errors: [{ message, code }] };
}
