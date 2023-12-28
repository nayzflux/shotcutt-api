import { SubscriptionPlan, User } from "@prisma/client";
import { Router } from "express";
import { Stripe } from "stripe";

const router = Router();

const STRIPE_SK = process.env.STRIPE_SECRET_KEY!;

const stripe = new Stripe(STRIPE_SK);

router.get("/:plan", async (req, res) => {
  const { plan } = req.params;

  const user = req.user as User;

  let price = "";

  if (plan === SubscriptionPlan.CLASSIC) {
    price = "price_1OS1LHI8BhkwOoFpJ7WFXF7g";
  }

  if (plan === SubscriptionPlan.PREMIUM) {
    price = "price_1OS1LZI8BhkwOoFpSdMgYZ1m";
  }

  if (plan === SubscriptionPlan.CLASSIC) {
    price = "price_1OS1LnI8BhkwOoFp4MbZXedT";
  }

  const session = await stripe.checkout.sessions.create({
    billing_address_collection: "auto",
    mode: "subscription",
    customer_email: user.email,
    line_items: [
      {
        price: price,
        quantity: 1,
      },
    ],
    success_url: `http://localhost:3000/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `http://localhost:3000/cancel.html`,
  });

  if (!session.url) return res.sendStatus(500);

  res.redirect(302, session.url);
});

export default router;
