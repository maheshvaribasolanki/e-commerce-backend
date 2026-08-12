import mongoose from "mongoose";
export async function connectDB() {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!uri) {
        throw new Error("Database connection failed: MONGO_URI or MONGODB_URI environment variable is not defined.");
    }
    await mongoose.connect(uri);
    console.log("Database connected successfully");
}
