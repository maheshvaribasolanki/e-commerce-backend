import { fail } from "../utils/envelope.js";
export function notFound(req, res) {
    res.status(404).json(fail(`Route not found ${req.method}`));
}
