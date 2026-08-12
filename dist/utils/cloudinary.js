import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
export function uploadSingleBufferToCloudinary(fileBuffer, folder = "ecommerce-monster-video/products") {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream({
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
        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
}
export async function uploadManyBuffersToCloudinary(files, folder = "ecommerce-monster-video/products") {
    return Promise.all(files.map((file) => uploadSingleBufferToCloudinary(file, folder)));
}
