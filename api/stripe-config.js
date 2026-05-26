const json = (response, statusCode, body) => {
  response.statusCode = statusCode;
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
};

module.exports = async (request, response) => {
  if (request.method === "OPTIONS") {
    json(response, 204, {});
    return;
  }

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
