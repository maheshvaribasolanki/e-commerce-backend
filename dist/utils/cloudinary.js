"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingleBufferToCloudinary = uploadSingleBufferToCloudinary;
exports.uploadManyBuffersToCloudinary = uploadManyBuffersToCloudinary;
const cloudinary_1 = require("cloudinary");
const streamifier_1 = __importDefault(require("streamifier"));
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
function uploadSingleBufferToCloudinary(fileBuffer, folder = "ecommerce-monster-video/products") {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.v2.uploader.upload_stream({
            folder,
            resource_type: "image",
        }, (error, result) => {
            if (error) {
                return reject(error);
            }
            if (!result) {
                return reject(new Error("Cloudinary upload failed!!!"));
            }
            resolve({
                url: result.secure_url,
                publicId: result.public_id,
            });
        });
        streamifier_1.default.createReadStream(fileBuffer).pipe(uploadStream);
    });
}
async function uploadManyBuffersToCloudinary(files, folder = "ecommerce-monster-video/products") {
    return Promise.all(files.map((file) => uploadSingleBufferToCloudinary(file, folder)));
}
