import mongoose, { model, Schema } from "mongoose";
const wishlistSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    products: {
        type: [
            {
                type: Schema.Types.ObjectId,
                ref: "Product",
            },
        ],
        default: [],
    },
}, { timestamps: true });
export const Wishlist = mongoose.models.Wishlist || model("Wishlist", wishlistSchema);
