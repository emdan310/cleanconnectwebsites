const json = (response, statusCode, body) => {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
};

module.exports = async (request, response) => {
  if (request.method !== "GET") {
    json(response, 405, { error: "Method not allowed" });
    return;
  }

  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.publishablestripeguy;

  if (!publishableKey) {
    json(response, 500, { error: "Stripe publishable key is not configured." });
    return;
  }

  json(response, 200, { publishableKey });
};
