const Stripe = require("stripe");

const json = (response, statusCode, body) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
};

const readBody = (request) =>
  new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });

module.exports = async (request, response) => {
  if (request.method !== "POST") {
    json(response, 405, { error: "Method not allowed" });
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY || process.env.Stripetestsec;

  if (!secretKey) {
    json(response, 500, { error: "Stripe is not configured." });
    return;
  }

  try {
    const stripe = new Stripe(secretKey);
    const { booking = {} } = await readBody(request);
    const origin = request.headers.origin || `https://${process.env.VERCEL_URL}`;
    const amount = Number(process.env.STRIPE_CLEANING_PRICE_CENTS || 3200);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded",
      redirect_on_completion: "if_required",
      payment_method_types: ["card"],
      return_url: `${origin}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      customer_email: booking.customerEmail || undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: booking.serviceLabel || "Room cleaning",
              description: booking.location ? String(booking.location).slice(0, 250) : undefined,
            },
          },
        },
      ],
      metadata: {
        order_group_id: booking.orderGroupId || "",
        service: booking.service || "cleaning",
      },
    });

    json(response, 200, { clientSecret: session.client_secret, id: session.id });
  } catch (error) {
    json(response, 500, { error: error.message || "Unable to start Stripe Checkout." });
  }
};
