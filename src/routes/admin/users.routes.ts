import { Router } from "express";
import { requireAdmin } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { User } from "../../models/User.js";
import { ok } from "../../utils/envelope.js";

export const adminUsersRouter = Router();

adminUsersRouter.use(requireAdmin);

adminUsersRouter.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await User.find().sort({ createdAt: -1 }).lean();

    const mapped = users.map((u: any) => ({
      id: u._id,
      clerkUserId: u.clerkUserId,
      email: u.email,
      name: u.name,
      role: u.role,
      points: u.points || 0,
      addresses: u.addresses || [],
    }));

    res.status(200).json(
      ok({
        users: mapped,
      }),
    );
  }),
);
