export function ok(data, meta) {
    return { status: "success", data, meta };
}
export function fail(message, code) {
    return { status: "error", data: null, errors: [{ message, code }] };
}
