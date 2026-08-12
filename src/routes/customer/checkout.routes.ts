import { Router, type Request, type Response } from "express";
import { Types } from "mongoose";
import { Product, ProductSize } from "../../models/Product.js";
import { getDbUserFromReq, requireAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { requireFound, requireText } from "../../utils/helpers.js";
import { User } from "../../models/User.js";
import { Cart } from "../../models/Cart.js";
import { AppError } from "../../utils/AppError.js";
import { Promo } from "../../models/Promo.js";
import { Order } from "../../models/Order.js";
import { ok } from "../../utils/envelope.js";

type UserAddressRow = {
  _id: Types.ObjectId;
  fullName: string;
  address: string;
  state: string;
  postalCode: string;
};

type CheckoutUserRow = {
  _id: Types.ObjectId;
  name?: string;
  email?: string;
  addresses: UserAddressRow[];
};

type CartRow = {
  items: Array<{
    product: Types.ObjectId;
    quantity: number;
    color?: string;
    size?: ProductSize;
  }>;
};

type ProductRow = {
  _id: Types.ObjectId;
  price: number;
  salePercentage: number;
  stock: number;
  status: "active" | "inactive";
};

type PromoRow = {
  code: string;
  percentage: number;
  count: number;
  minimumOrderValue: number;
  startsAt: Date;
  endsAt: Date;
};

export const customerCheckoutRouter = Router();

customerCheckoutRouter.use(requireAuth);

customerCheckoutRouter.post(
  "/checkout/place-order",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const addressId = String(req.body.addressId || "").trim();
    const promoCode = String(req.body.promoCode || "")
      .trim()
      .toUpperCase();

    requireText(addressId, "Address is required");

    // fetch user details and cart
    const [user, cart] = await Promise.all([
      User.findById(dbUser._id)
        .select("name email addresses")
        .lean<CheckoutUserRow | null>(),

      Cart.findOne({ user: dbUser._id }).select("items").lean<CartRow | null>(),
    ]);

    const foundUser = requireFound(user, "User not found", 404);
    const foundCart = requireFound(cart, "Cart not found", 404);

    if (!foundCart.items.length) {
      throw new AppError(400, "Cart is empty");
    }

    const selectedAddress = foundUser.addresses.find(
      (item) => String(item._id) === addressId,
    );

    if (!selectedAddress) {
      throw new AppError(404, "Address not found");
    }

    const products = await Product.find({
      _id: { $in: foundCart.items.map((item) => item.product) },
    })
      .select("price salePercentage stock status")
      .lean<ProductRow[]>();

    const productMap = new Map(
      products.map((item) => [String(item._id), item]),
    );

    let totalItems = 0;
    let subTotal = 0;

    const items = foundCart.items.map((cartItem) => {
      const product = productMap.get(String(cartItem.product));

      if (!product || product.status !== "active") {
        throw new AppError(400, "One or more cart items are not available");
      }

      if (product.stock < cartItem.quantity) {
        throw new AppError(400, "Cart items are out of stock");
      }

      const finalPrice = product.salePercentage
        ? Math.round(
            product.price - (product.price * product.salePercentage) / 100,
          )
        : product.price;

      totalItems += cartItem.quantity;
      subTotal += finalPrice * cartItem.quantity;

      return {
        product: cartItem.product,
        quantity: cartItem.quantity,
      };
    });

    let appliedPromoCode = "";
    let discountAmount = 0;

    if (promoCode) {
      const promo = await Promo.findOne({ code: promoCode })
        .select("code percentage count minimumOrderValue startsAt endsAt")
        .lean<PromoRow | null>();

      const foundPromo = requireFound(promo, "Promo not found", 404);
      const now = new Date();

      if (
        now < foundPromo.startsAt ||
        now > foundPromo.endsAt ||
        foundPromo.count < 1
      ) {
        throw new AppError(400, "Promo code is not active");
      }

      if (subTotal < foundPromo.minimumOrderValue) {
        throw new AppError(
          400,
          "Minimum order value for this promo is not reached",
        );
      }

      appliedPromoCode = foundPromo.code;
      discountAmount = Math.round((subTotal * foundPromo.percentage) / 100);
    }

    const totalAmount = Math.max(subTotal - discountAmount, 0);

    // Update product stock
    for (const item of items) {
      const updated = await Product.updateOne(
        {
          _id: item.product,
          stock: { $gte: item.quantity },
        },
        {
          $inc: { stock: -item.quantity },
        },
      );

      if (!updated.matchedCount) {
        throw new AppError(400, "One or more cart items are out of stock");
      }
    }

    // Decrement promo usage if applied
    if (appliedPromoCode) {
      await Promo.updateOne(
        {
          code: appliedPromoCode,
          count: { $gt: 0 },
        },
        {
          $inc: { count: -1 },
        },
      );
    }

    // Clear cart
    await Cart.updateOne({ user: dbUser._id }, { $set: { items: [] } });

    const deliveryAddress = [
      selectedAddress.address,
      selectedAddress.state,
      selectedAddress.postalCode,
    ]
      .filter(Boolean)
      .join(", ");

    const paymentId = `order_${Date.now()}`;

    const order = await Order.create({
      user: dbUser._id,
      customerName: foundUser.name || selectedAddress.fullName,
      customerEmail: foundUser.email || "",
      items,
      totalItems,
      deliveryName: selectedAddress.fullName,
      deliveryAddress,
      promoCode: appliedPromoCode,
      discountAmount,
      totalAmount,
      paymentStatus: "pending",
      orderStatus: "placed",
      paymentId,
    });

    res.json(
      ok({
        _id: String(order._id),
        totalItems,
        discountAmount,
        totalAmount,
      }),
    );
  }),
);
