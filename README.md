# MediCare HMS — Hospital Management API

Node.js and Express API for the MediCare hospital-management prototype, backed by MongoDB/Mongoose.

## Current scope

The codebase includes API modules and demo data for patients, doctors, appointments, prescriptions, inventory, invoices, beds, laboratory orders, medical records, dispensing and payments.

## Stack

Node.js, Express, MongoDB/Mongoose and Razorpay integration scaffolding.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and configure `PORT`, `MONGO_URI` or `MONGODB_URI`, `FRONTEND_URL`, and the payment-provider variables.
3. Start with `npm start`.

The API defaults to port `5000`. `GET /api/health` reports the current Node runtime, process uptime and database connection state.

## Important security status

**This repository is a demonstration prototype, not a production-ready hospital system. Do not use real patient records or expose it to the public internet.** The current API contains demo authentication logic that decodes unsigned Base64 payloads and accepts identity/role information from request headers. Its password hashing uses a fixed salt, and payment code includes mock fallback credentials. These are not secure authentication or payment-verification mechanisms.

Before any real deployment, implement signed and verified JWT/session authentication, role and patient-record authorization, a modern password hash (Argon2id or bcrypt with unique salts), verified payment webhooks, audit controls, encrypted secrets, strict validation and privacy/compliance review. Replace all demo seed data with synthetic fixtures only.

## Related frontend

[MediCare HMS frontend](https://github.com/Nashid-k/medicare_hms_frontend)

