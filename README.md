# medicare_hms_backend

MediCare API backend built with Node.js, Express, and MongoDB.

## Run locally

1. Install dependencies with `npm install`.
2. Configure `PORT`, `MONGO_URI`, `FRONTEND_URL`, `RAZORPAY_IDKEY`, and `RAZORPAY_SECRET_KEY` in a local `.env` file. Set `FRONTEND_URL` to the frontend origin, such as `https://medicare.example.com`, without a trailing slash.
3. Start the API with `npm start`.

The `.env` file contains private credentials and is excluded from Git. Configure the same variables in the backend hosting provider's environment settings. CORS allows the configured frontend origin; when `FRONTEND_URL` is omitted, local development uses `http://localhost:5173`.
