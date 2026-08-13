import "./config/env.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

function startServer() {
  app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
  });

  connectDB().catch((error) => {
    console.error("Database connection failed:", error);
  });
}

startServer();
