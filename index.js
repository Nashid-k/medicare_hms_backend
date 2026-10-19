require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const { seedDatabase } = require('./seed');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medicare_hms';

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    const maskedUri = MONGO_URI.replace(/:([^:@]+)@/, ':****@');
    console.log('✅ Connected to MongoDB:', maskedUri);
    if (process.env.NODE_ENV !== 'production') {
      await seedDatabase(false);
    }
    app.listen(PORT, () => {
      console.log(`🏥 MediCare Hospital Core OS Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
