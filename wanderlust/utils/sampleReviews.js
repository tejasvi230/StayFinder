// Adds realistic-looking sample reviews (4-5 per listing) so the app doesn't look empty.
// The sample reviewers get random, unknown passwords - nobody can log in as them.

const crypto = require("crypto");

const REVIEWERS = [
  "priya_sharma", "arjun_mehta", "meera_iyer", "rohan_verma",
  "sneha_kapoor", "karan_malhotra", "ananya_rao", "vikram_singh",
  "isha_nair", "rahul_khanna",
];

// [rating, comment] - mostly positive, a few honest 3-4 star ones.
const REVIEW_POOL = [
  [5, "Absolutely loved our stay! The place was spotless and looked even better than the photos."],
  [5, "The host was super responsive and check-in was effortless. We'd happily book again."],
  [5, "Perfect getaway. Quiet, comfortable and exactly what we needed to switch off for a few days."],
  [5, "Beautiful property with great attention to detail. Everything we needed was there."],
  [5, "Five stars all the way - the location is fantastic and the beds were so comfortable."],
  [4, "Great value for the price. Very clean and cosy, just a little hard to find on the first try."],
  [4, "Lovely stay overall. The amenities were all as described and the host gave great local tips."],
  [4, "Really enjoyed it. Wifi was fast and the kitchen had everything we needed to cook."],
  [4, "Comfortable and well kept. A couple of small things could be better, but we'd come back."],
  [4, "Peaceful spot and a very friendly host. Check-out was quick and easy too."],
  [5, "Our whole family had a wonderful time. The space is bigger than it looks in the pictures."],
  [4, "Nice place, nice neighbourhood. Would recommend booking a few nights to really relax."],
  [3, "Good stay, though it was a bit noisier than expected in the evenings. Clean and well equipped."],
  [3, "Decent place for the price. The photos are a little flattering, but the host was helpful."],
  [5, "Stunning! Woke up to an amazing view every morning. Can't recommend this place enough."],
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

function shuffled(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function ensureReviewers(User) {
  const users = [];
  for (const username of REVIEWERS) {
    let user = await User.findOne({ username });
    if (!user) {
      const password = crypto.randomBytes(24).toString("hex");
      user = await User.register(
        new User({ username, email: `${username}@example.com` }),
        password,
      );
    }
    users.push(user);
  }
  return users;
}

// Gives every listing that has fewer than `min` reviews enough sample reviews to
// reach 4-5 in total. Safe to run again - listings that already have 4+ are skipped.
async function addSampleReviews({ Listing, Review, User, min = 4, max = 5 }) {
  const users = await ensureReviewers(User);
  const listings = await Listing.find({});
  let added = 0;
  let touched = 0;

  for (const listing of listings) {
    const existing = (listing.reviews || []).length;
    if (existing >= min) continue;

    const target = randomInt(min, max);
    const needed = target - existing;
    const reviewers = shuffled(users).slice(0, needed);
    const comments = shuffled(REVIEW_POOL).slice(0, needed);

    const docs = reviewers.map((author, i) => {
      const [rating, comment] = comments[i];
      const daysAgo = randomInt(3, 180);
      return {
        rating,
        comment,
        author: author._id,
        createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      };
    });

    const created = await Review.insertMany(docs);
    await Listing.updateOne(
      { _id: listing._id },
      { $push: { reviews: { $each: created.map((r) => r._id) } } },
    );
    added += created.length;
    touched += 1;
  }

  return { added, touched, total: listings.length };
}

module.exports = { addSampleReviews, REVIEWERS, REVIEW_POOL };
