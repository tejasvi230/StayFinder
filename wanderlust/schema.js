const Joi = require("joi");
const { AMENITY_KEYS } = require("./utils/amenities.js");
const { CATEGORIES } = require("./utils/categories.js");

module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().trim().required(),
    description: Joi.string().trim().required(),
    location: Joi.string().trim().required(),
    country: Joi.string().trim().required(),
    price: Joi.number().min(0).required(),
    categories: Joi.array()
      .items(Joi.string().valid(...CATEGORIES))
      .single()
      .default([]),
    amenities: Joi.array()
      .items(Joi.string().valid(...AMENITY_KEYS))
      .single()
      .default([]),
    image: Joi.string().uri().allow("", null),
  }).required(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().trim().required(),
  }).required(),
});
