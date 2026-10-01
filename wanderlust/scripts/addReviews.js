// Adds sample reviews so every listing has 4-5 (skips listings that already have 4+).
// Run with:  npm run reviews
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
}

const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const User = require("../models/user.js");
const { addSampleReviews } = require("../utils/sampleReviews.js");

const dbUrl =
  process.env.ATLASDB_URL ||
  process.env.MONGO_URL ||
  "mongodb://127.0.0.1:27017/wanderlust";

(async () => {
  try {
    await mongoose.connect(dbUrl);
    const { added, touched, total } = await addSampleReviews({ Listing, Review, User });
    console.log(`Added ${added} reviews to ${touched} of ${total} listings.`);
  } catch (err) {
    console.error("Adding reviews failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
