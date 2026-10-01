// One-off helper: gives existing listings (created before categories/amenities/maps
// existed) their categories, amenities and map coordinates, WITHOUT deleting anything.
// (Map coordinates need MAP_TOKEN in your .env.)
// Run with:  npm run backfill
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
}

const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const geocode = require("../utils/geocode.js");
const backfillListings = require("../utils/backfillListings.js");

const dbUrl =
  process.env.ATLASDB_URL ||
  process.env.MONGO_URL ||
  "mongodb://127.0.0.1:27017/wanderlust";

(async () => {
  try {
    await mongoose.connect(dbUrl);
    const { updated, total } = await backfillListings({ Listing, geocode });
    console.log(`Updated ${updated} of ${total} listings.`);
  } catch (err) {
    console.error("Backfill failed:", err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
})();
