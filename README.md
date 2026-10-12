# ELECTRO STORE — Production Deployment & Architecture Guide

ELECTRO STORE is a full-stack e-commerce web platform engineered with React 19, TypeScript, Tailwind CSS, Express, Firebase Firestore & Authentication, and Razorpay Payments.

---

## 1. Environment & Architecture Separation

The application supports clean separation across **Development**, **Staging/Test**, and **Production** environments via environment variables:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `APP_ENV` | Application runtime environment | `production` / `development` |
| `APP_BASE_URL` | Fully qualified base domain URL | `https://electrostore.com` |
| `PAYMENT_MODE` | Gateway mode (`test` or `live`) | `test` |
| `RAZORPAY_KEY_ID` | Razorpay API Key ID | `rzp_test_...` or `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay API Key Secret (Server-only) | `...` |
| `RAZORPAY_WEBHOOK_SECRET` | Secret to sign & verify webhooks | `...` |
| `GEMINI_API_KEY` | Server-side AI key | `...` |

---

## 2. Security Hardening & Zero-Trust Architecture

- **No Secrets in Browser**: All private credentials (`RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `GEMINI_API_KEY`) reside exclusively in Node server memory and environment secrets.
- **Server-Side Order & Tax Verification**: Cart pricing, 18% GST calculation, shipping rules, and coupon discounts are calculated and verified server-side.
- **Atomic Transactions**: Stock deduction occurs atomically in Firestore transactions upon signature-verified payments.
- **Sliding-Window Rate Limiting**: Abuse protection on `/api/payments/create-order`, `/api/payments/verify`, `/api/coupons/validate`, and `/api/contact`.
- **Security Headers**: Standard HTTP headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, `Referrer-Policy`) enforced on all server responses.
- **Masked Audit Logs**: Server logs sanitize and redact sensitive information (tokens, signatures, keys, passwords, CVV).

---

## 3. Switching Razorpay to LIVE Mode

When ready to accept live payments:

1. Log into your Razorpay Dashboard (`https://dashboard.razorpay.com`).
2. Switch toggle to **Live Mode**.
3. Generate **Live API Keys** (`Key ID` and `Key Secret`).
4. Generate a **Webhook Secret** and set the webhook URL to `https://<YOUR_DOMAIN>/api/payments/webhook` with the `payment.captured` event.
5. In Cloud Run / Server Environment, update:
   - `PAYMENT_MODE="live"`
   - `RAZORPAY_KEY_ID="rzp_live_..."`
   - `RAZORPAY_KEY_SECRET="<YOUR_LIVE_SECRET>"`
   - `RAZORPAY_WEBHOOK_SECRET="<YOUR_WEBHOOK_SECRET>"`
6. Restart the server container.

---

## 4. Production Build & Deployment

```bash
# Install dependencies
npm install

# Type-check and build production bundle
npm run build

# Start production server
npm start
```
The server binds to `0.0.0.0:3000` and serves the compiled SPA alongside secure `/api` endpoints.
