// Fills in fields that older listings don't have yet (categories, amenities, map pin)
// WITHOUT deleting or overwriting anything. A field is only filled when it is completely
// missing - so if a host deliberately unticks everything, that choice is kept.

const { suggestFor } = require("./amenities.js");
const { fromLegacy } = require("./categories.js");

async function backfillListings({ Listing, geocode } = {}) {
  const listings = await Listing.find({}).lean(); // lean = the raw database values
  let updated = 0;

  for (const listing of listings) {
    const $set = {};
    const suggestion = suggestFor(listing);

    if (listing.categories === undefined) {
      // Keep the single category from the previous version, then add the others that fit.
      const old = fromLegacy(listing.category);
      $set.categories = [...new Set([...(old ? [old] : []), ...suggestion.categories])];
    }
    if (listing.amenities === undefined) {
      $set.amenities = suggestion.amenities;
    }
    const hasPin = listing.geometry?.coordinates?.length === 2;
    if (!hasPin && geocode) {
      const geometry = await geocode(`${listing.location}, ${listing.country}`);
      if (geometry) $set.geometry = geometry;
    }

    if (Object.keys($set).length) {
      await Listing.updateOne({ _id: listing._id }, { $set }, { runValidators: true });
      updated += 1;
    }
  }
  return { updated, total: listings.length };
}

module.exports = backfillListings;
