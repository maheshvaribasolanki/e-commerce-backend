import mongoose, { model, Schema } from "mongoose";
const bannerSchema = new Schema({
    imageUrl: {
        type: String,
        required: true,
        trim: true,
    },
    imagePublicId: {
        type: String,
        required: true,
        trim: true,
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
export const Banner = mongoose.models.Banner || model("Banner", bannerSchema);
