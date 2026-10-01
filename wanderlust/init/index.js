if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
}

const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const { suggestFor } = require("../utils/amenities.js");
const geocode = require("../utils/geocode.js");
const Review = require("../models/review.js");
const User = require("../models/user.js");
const { addSampleReviews } = require("../utils/sampleReviews.js");

const dbUrl =
  process.env.ATLASDB_URL ||
  process.env.MONGO_URL ||
  "mongodb://127.0.0.1:27017/wanderlust";

async function seed() {
  try {
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB");

    await Listing.deleteMany({});
    const prepared = [];
    for (const item of initData.data) {
      const geometry = await geocode(`${item.location}, ${item.country}`); // null without MAP_TOKEN
      prepared.push({ ...item, ...suggestFor(item), ...(geometry && { geometry }) });
    }
    await Listing.insertMany(prepared);
    const { added } = await addSampleReviews({ Listing, Review, User });
    console.log(`Added ${added} sample reviews`);
    console.log(`Seeded ${initData.data.length} listings`);
  } catch (err) {
    console.error("Seeding failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

seed();
