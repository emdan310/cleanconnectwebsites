# Stripe Setup

The app uses Stripe Checkout through Vercel serverless functions.

## Required Vercel environment variables

- `STRIPE_SECRET_KEY`: your rotated Stripe live secret key
- `STRIPE_PUBLISHABLE_KEY`: your Stripe publishable key, used by embedded Checkout
- `STRIPE_CLEANING_PRICE_CENTS`: optional; defaults to `3200`

Do not commit Stripe secret keys to GitHub or place them in frontend JavaScript. Publishable keys are safe to expose, but this project still serves it from a Vercel API config endpoint so Stripe setup stays centralized.

## Setup

1. Rotate any secret key that has been pasted into chat, email, screenshots, or shared documents.
2. In Vercel, open the `cleanconnectwebsites` project.
3. Add `STRIPE_SECRET_KEY` under Settings -> Environment Variables for Production.
4. Add `STRIPE_PUBLISHABLE_KEY` for Production.
5. Redeploy production.

The frontend mounts embedded Stripe Checkout inside the CleanConnect payment page. `/api/create-checkout-session` returns a Checkout client secret, and `/api/confirm-checkout-session` verifies payment before saving the booking.
