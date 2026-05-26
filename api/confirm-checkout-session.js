const Stripe = require("stripe");

module.exports = async (request, response) => {
  if (request.method !== "GET") {
    response.statusCode = 405;
    response.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    response.statusCode = 500;
    response.end(JSON.stringify({ error: "Stripe is not configured." }));
    return;
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const url = new URL(request.url, `https://${request.headers.host}`);
    const sessionId = url.searchParams.get("session_id");

    if (!sessionId) {
      response.statusCode = 400;
      response.end(JSON.stringify({ error: "Missing Checkout Session." }));
      return;
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({
      id: session.id,
      paid: session.payment_status === "paid",
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total,
      currency: session.currency,
      orderGroupId: session.metadata?.order_group_id || "",
    }));
  } catch (error) {
    response.statusCode = 500;
    response.end(JSON.stringify({ error: error.message || "Unable to verify Stripe Checkout." }));
  }
};
