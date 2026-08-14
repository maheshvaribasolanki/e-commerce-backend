import "./src/config/env.js";
import { connectDB } from "./src/config/db.js";
import { User } from "./src/models/User.js";

async function seed() {
  await connectDB();

  const samples = [
    {
      clerkUserId: "seed_user_1",
      email: "user1@example.com",
      name: "User One",
      role: "user",
    },
    {
      clerkUserId: "seed_user_2",
      email: "user2@example.com",
      name: "User Two",
      role: "user",
    },
    {
      clerkUserId: "seed_admin_1",
      email: "admin@example.com",
      name: "Admin One",
      role: "admin",
    },
  ];

  try {
    const res = await User.insertMany(samples, { ordered: false });
    console.log(`Inserted ${res.length} users`);
  } catch (err: any) {
    // ignore duplicate errors and show summary
    if (err?.code === 11000) {
      console.warn("Some users may already exist (duplicate keys). Partial insert performed.");
    } else {
      console.error("Seed failed:", err);
      process.exit(1);
    }
  }

  process.exit(0);
}

void seed();
