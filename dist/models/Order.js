import mongoose, { model, Schema } from "mongoose";
const OrderItemsSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
}, { _id: false });
const OrderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    customerName: {
        type: String,
        default: "",
        trim: true,
    },
    customerEmail: {
        type: String,
        default: "",
        trim: true,
    },
    items: {
        type: [OrderItemsSchema],
        default: [],
    },
    totalItems: {
        type: Number,
        required: true,
        min: 1,
    },
    deliveryName: {
        type: String,
        required: true,
        trim: true,
    },
    deliveryAddress: {
        type: String,
        required: true,
        trim: true,
    },
    promoCode: {
        type: String,
        default: "",
        uppercase: true,
        trim: true,
    },
    discountAmount: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
    },
    orderStatus: {
        type: String,
        enum: ["placed", "shipped", "delivered", "returned", "cancelled"],
        default: "placed",
    },
    razorpayOrderId: {
        type: String,
        default: "",
        trim: true,
    },
    paymentId: {
        type: String,
        default: "",
        trim: true,
    },
    paidAt: {
        type: Date,
        default: null,
    },
    deliveredAt: {
        type: Date,
        default: null,
    },
    returnedAt: {
        type: Date,
        default: null,
    },
    cancelledAt: {
        type: Date,
        default: null,
    },
}, { timestamps: true });
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });
export const Order = mongoose.models.Order || model("Order", OrderSchema);
