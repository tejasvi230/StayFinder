const express = require("express");
const router = express.Router();

const wrapAsync = require("../utils/wrapAsync.js");
const listingController = require("../controller/listing.js");
const {
  isLoggedIn,
  isOwner,
  validateListing,
} = require("../middlewares.js");

router.get("/", wrapAsync(listingController.index));

// Keep fixed paths before /:id so "search" and "new" are not treated as IDs.
router.get("/search", wrapAsync(listingController.search));
router.get("/filter/:slug", wrapAsync(listingController.filter));
router.get("/new", isLoggedIn, listingController.renderNewForm);

router.post(
  "/",
  isLoggedIn,
  validateListing,
  wrapAsync(listingController.createListing),
);

router.get("/:id", wrapAsync(listingController.showListing));

router.get(
  "/:id/edit",
  isLoggedIn,
  wrapAsync(isOwner),
  wrapAsync(listingController.renderEditForm),
);

router.put(
  "/:id",
  isLoggedIn,
  wrapAsync(isOwner),
  validateListing,
  wrapAsync(listingController.updateListing),
);

router.delete(
  "/:id",
  isLoggedIn,
  wrapAsync(isOwner),
  wrapAsync(listingController.destroyListing),
);

module.exports = router;
