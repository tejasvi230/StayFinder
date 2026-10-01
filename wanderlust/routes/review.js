const express = require("express");
const router = express.Router({ mergeParams: true });

const wrapAsync = require("../utils/wrapAsync.js");
const reviewController = require("../controller/review.js");
const {
  isLoggedIn,
  validateReview,
  isReviewAuthor,
} = require("../middlewares.js");

router.post(
  "/",
  isLoggedIn,
  validateReview,
  wrapAsync(reviewController.createReview),
);

router.delete(
  "/:reviewId",
  isLoggedIn,
  wrapAsync(isReviewAuthor),
  wrapAsync(reviewController.destroyReview),
);

module.exports = router;
