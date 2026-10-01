const Listing = require("../models/listing.js");
const ExpressError = require("../utils/ExpressError.js");
const { groupAmenities, orderedAmenities } = require("../utils/amenities.js");
const geocode = require("../utils/geocode.js");
const { findFilterBySlug } = require("../utils/categories.js");

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=60";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports.index = async (req, res) => {
  const allListings = await Listing.find({}).sort({ _id: -1 });
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({ path: "reviews", populate: { path: "author" } })
    .populate("owner");

  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }

  // Older listings have no coordinates yet: look them up once and save them.
  let coordinates = listing.geometry?.coordinates;
  if (!(coordinates && coordinates.length === 2)) {
    const geometry = await geocode(`${listing.location}, ${listing.country}`);
    if (geometry) {
      await Listing.updateOne({ _id: listing._id }, { $set: { geometry } });
      coordinates = geometry.coordinates;
    }
  }
  const mapToken = process.env.MAP_TOKEN || "";
  const mapData =
    mapToken && coordinates && coordinates.length === 2
      ? { token: mapToken, coordinates, title: listing.title }
      : null;

  const amenityGroups = groupAmenities(listing.amenities);
  const topAmenities = orderedAmenities(listing.amenities).slice(0, 6);
  const totalAmenities = amenityGroups.reduce((n, g) => n + g.items.length, 0);

  const reviews = listing.reviews || [];
  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
    : 0;

  res.render("listings/show.ejs", {
    listing,
    amenityGroups,
    topAmenities,
    totalAmenities,
    avgRating,
    mapData,
  });
};

module.exports.createListing = async (req, res) => {
  const listingData = { ...req.body.listing };
  const imageUrl = listingData.image?.trim();
  delete listingData.image;

  const geometry = await geocode(
    `${listingData.location}, ${listingData.country}`,
  );

  const newListing = new Listing({
    ...listingData,
    ...(geometry && { geometry }),
    image: {
      filename: "listingimage",
      url: imageUrl || DEFAULT_IMAGE,
    },
    owner: req.user._id,
  });

  await newListing.save();
  req.flash("success", "New listing created!");
  res.redirect(`/listings/${newListing._id}`);
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }

  res.render("listings/edit.ejs", { listing });
};

module.exports.updateListing = async (req, res) => {
  const { id } = req.params;
  const listingData = { ...req.body.listing };
  const imageUrl = listingData.image?.trim();
  delete listingData.image;

  const update = { ...listingData };

  // Only look the place up again if the location or country actually changed.
  const existing = await Listing.findById(id);
  if (!existing) {
    throw new ExpressError(404, "Listing not found");
  }
  const placeChanged =
    existing.location !== listingData.location ||
    existing.country !== listingData.country;
  if (placeChanged) {
    const geometry = await geocode(
      `${listingData.location}, ${listingData.country}`,
    );
    if (geometry) {
      update.geometry = geometry;
    } else {
      update.$unset = { geometry: 1 }; // drop the old (now wrong) pin
    }
  }

  // An unticked checkbox sends nothing, so a missing field means "no amenities".
  update.amenities = listingData.amenities || [];
  update.categories = listingData.categories || [];
  if (imageUrl) {
    update.image = { filename: "listingimage", url: imageUrl };
  }

  const updatedListing = await Listing.findByIdAndUpdate(id, update, {
    runValidators: true,
    new: true,
  });

  if (!updatedListing) {
    throw new ExpressError(404, "Listing not found");
  }

  req.flash("success", "Listing updated!");
  res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
  const { id } = req.params;
  const deletedListing = await Listing.findByIdAndDelete(id);

  if (!deletedListing) {
    throw new ExpressError(404, "Listing not found");
  }

  req.flash("success", "Listing deleted!");
  res.redirect("/listings");
};

module.exports.search = async (req, res) => {
  const input = String(req.query.q || "")
    .trim()
    .replace(/\s+/g, " ");

  if (!input) {
    return res.redirect("/listings");
  }

  // Every word must match the title, location or country (so "goa beach" or
  // "paris apartment" both work). A number also matches listings priced at or
  // below it (e.g. "2000").
  const words = input.split(" ").slice(0, 6);
  const wordFilters = words.map((word) => {
    const regex = new RegExp(escapeRegex(word), "i");
    const conditions = [
      { title: regex },
      { location: regex },
      { country: regex },
      { description: regex },
    ];
    const numeric = Number(word.replace(/,/g, ""));
    if (Number.isFinite(numeric) && numeric >= 0) {
      conditions.push({ price: { $lte: numeric } });
    }
    return { $or: conditions };
  });

  const allListings = await Listing.find({ $and: wordFilters }).sort({
    _id: -1,
  });

  res.render("listings/index.ejs", {
    allListings,
    searchQuery: input,
  });
};

// /listings/filter/:slug - powers the category slider.
module.exports.filter = async (req, res) => {
  const filter = findFilterBySlug(req.params.slug);
  if (!filter) {
    throw new ExpressError(404, "That category doesn't exist");
  }

  let allListings;
  if (filter.name === "Trending") {
    // Best-rated stays first (ties broken by number of reviews).
    allListings = await Listing.aggregate([
      {
        $lookup: {
          from: "reviews",
          localField: "reviews",
          foreignField: "_id",
          as: "reviewDocs",
        },
      },
      {
        $addFields: {
          avgRating: { $avg: "$reviewDocs.rating" },
          reviewCount: { $size: "$reviewDocs" },
        },
      },
      { $match: { reviewCount: { $gt: 0 } } },
      { $sort: { avgRating: -1, reviewCount: -1, _id: -1 } },
      { $limit: 12 },
      { $project: { reviewDocs: 0 } },
    ]);
  } else if (filter.name === "New") {
    allListings = await Listing.find({}).sort({ _id: -1 }).limit(12);
  } else {
    allListings = await Listing.find({ categories: filter.name }).sort({ _id: -1 });
  }

  res.render("listings/index.ejs", { allListings, activeFilter: filter });
};
