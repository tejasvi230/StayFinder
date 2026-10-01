if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const ExpressError = require("./utils/ExpressError.js");
const { AMENITY_GROUPS } = require("./utils/amenities.js");
const { CATEGORIES, FILTERS } = require("./utils/categories.js");
const User = require("./models/user.js");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
const { addSampleReviews } = require("./utils/sampleReviews.js");
const backfillListings = require("./utils/backfillListings.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

const app = express();
const dbUrl =
  process.env.ATLASDB_URL ||
  process.env.MONGO_URL ||
  "mongodb://127.0.0.1:27017/wanderlust";
const sessionSecret = process.env.SECRET || "wanderlust-development-secret";

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.locals.categories = CATEGORIES;
app.locals.filters = FILTERS;
app.locals.amenityGroups = AMENITY_GROUPS;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const sessionOptions = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

// Using the default in-memory session store in tests keeps smoke tests independent
// from MongoDB. Normal development/production uses MongoDB-backed sessions.
if (process.env.NODE_ENV !== "test") {
  const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: { secret: sessionSecret },
    touchAfter: 24 * 60 * 60,
  });

  store.on("error", (err) => {
    console.error("ERROR in Mongo session store:", err.message);
  });

  sessionOptions.store = store;
}

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// Express 5-safe catch-all handler (avoids the old app.all("*") pattern).
app.use((req, res, next) => {
  next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  const message = err.message || "Something went wrong!";
  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }
  res.status(statusCode).render("listings/error.ejs", { message });
});

async function connectDB() {
  await mongoose.connect(dbUrl);
  console.log("Connected to MongoDB");
}

// Development convenience: make sure every listing has 4-5 sample reviews.
// Skipped in production, or when SAMPLE_REVIEWS=off is set in .env.
async function ensureSampleReviews() {
  if (process.env.NODE_ENV === "production") return;
  if (String(process.env.SAMPLE_REVIEWS).toLowerCase() === "off") return;
  try {
    const { added, touched } = await addSampleReviews({ Listing, Review, User });
    if (added) console.log(`Added ${added} sample reviews to ${touched} listings`);
  } catch (err) {
    console.error("Could not add sample reviews:", err.message);
  }
}

// Older listings get their categories and amenities filled in automatically (nothing is
// deleted or overwritten). This runs in every environment - it only touches missing fields.
async function ensureListingDefaults() {
  try {
    const { updated } = await backfillListings({ Listing });
    if (updated) console.log(`Filled in categories/amenities on ${updated} older listings`);
  } catch (err) {
    console.error("Could not update older listings:", err.message);
  }
}

async function startServer() {
  try {
    await connectDB();
    await ensureListingDefaults();
    await ensureSampleReviews();
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log(`StayFinder is listening on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start StayFinder:", err.message);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, connectDB, startServer, ensureSampleReviews, ensureListingDefaults };
