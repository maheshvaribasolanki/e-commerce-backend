import mongoose, { model, Schema } from "mongoose";
const PromoSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
    },
    percentage: {
        type: Number,
        required: true,
        min: 1,
        max: 100,
    },
    count: {
        type: Number,
        required: true,
        min: 1,
    },
    minimumOrderValue: {
        type: Number,
        required: true,
        min: 0,
    },
    startsAt: {
        type: Date,
        required: true,
    },
    endsAt: {
        type: Date,
        required: true,
    },
}, { timestamps: true });
export const Promo = mongoose.models.Promo || model("Promo", PromoSchema);
