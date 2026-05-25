# Stripe Setup

The app uses Stripe Checkout through Vercel serverless functions.

## Required Vercel environment variables

- `STRIPE_SECRET_KEY`: your rotated Stripe live secret key
- `STRIPE_CLEANING_PRICE_CENTS`: optional; defaults to `3200`

Do not commit Stripe secret keys to GitHub or place them in frontend JavaScript.

## Setup

1. Rotate any secret key that has been pasted into chat, email, screenshots, or shared documents.
2. In Vercel, open the `cleanconnectwebsites` project.
3. Add `STRIPE_SECRET_KEY` under Settings -> Environment Variables for Production.
4. Redeploy production.

The frontend redirects to `/api/create-checkout-session`, Stripe hosts the card form, and `/api/confirm-checkout-session` verifies payment before saving the booking.
