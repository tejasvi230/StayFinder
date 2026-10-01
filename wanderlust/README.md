# StayFinder

An Airbnb-style vacation rental web app. Browse stays, search and filter them by category, see each place on a map, read reviews, and list your own property.

Built with **Node.js, Express, MongoDB and EJS**.

## Features

### Browsing and discovery

- **Category slider** - a horizontally scrolling bar of 21 icon categories (Rooms, Iconic Cities, Trending, Mountains, Castles, Amazing Pools, Camping, Farm, Arctic, Beach, Boat, Ski-in/out, Apartment, New, Woodlands, Lake, Cabins, Countryside, Bed & Breakfasts, Campsite, Historical Homes). Each one opens its own page at `/listings/filter/<category>`.
  - **Trending** shows the top-rated stays (ranked by average review score).
  - **New** shows the most recently added stays.
  - A listing can belong to several categories at once (for example Cabins and Lake).
- **Search bar** - type a place, a title or a price. Every word must match the title, location, country or description, and a number also matches stays priced at or below it.
- **Listing cards** - photo, title, location and price per night, with a hover effect and a friendly empty state when nothing matches.

### Listing page

- **Full details** - hosted by, description, cost, categories, location and country, each with an icon.
- **Amenities** - Airbnb-style "What this place offers" with icons, plus a **"Show all amenities"** popup grouped into Basics, Scenic views, Bathroom, Bedroom and laundry, Entertainment, Outdoor, Kitchen and dining, and Location features.
- **Interactive map** - a "Where you'll be" section built with Mapbox, showing a pin for the listing. Addresses are turned into coordinates automatically (geocoding) when a listing is created or its location changes.
- **Reviews** - star ratings shown as star icons, a user icon next to each reviewer, an average rating and a review count. Logged-in users can leave a review with a clickable star rating and delete their own.

### Accounts and hosting

- **Sign up, log in and log out** with secure password hashing (Passport.js).
- **Create, edit and delete listings** - only logged-in users can create, and only the owner can edit or delete.
- **Form validation** on both the browser and the server (Joi).
- **Flash messages** for feedback such as "New listing created!".

### Design

- Airbnb-inspired UI with a coral colour theme, gradient buttons, rounded cards and a custom StayFinder logo.
- Login and Sign up buttons at the top right (they become an avatar menu once you are logged in).
- Fully responsive: collapsing navbar on phones, swipeable category slider, adaptive grids.

### Developer conveniences

- Sample data seeding and automatic sample reviews (4-5 per listing) in development.
- Older listings are upgraded automatically (categories, amenities, map pins) without deleting anything.
- A smoke-check script that verifies the app loads without needing a database.

---

## Tech stack

| Area               | Technology                                                           |
| ------------------ | -------------------------------------------------------------------- |
| Runtime            | Node.js                                                              |
| Server framework   | Express 5                                                            |
| Database           | MongoDB with Mongoose (ODM)                                          |
| Templating         | EJS with ejs-mate (layouts and partials)                             |
| Authentication     | Passport.js (`passport-local`, `passport-local-mongoose`)            |
| Sessions           | `express-session` stored in MongoDB with `connect-mongo`             |
| Validation         | Joi (server) and Bootstrap validation (browser)                      |
| Maps and geocoding | Mapbox GL JS and the Mapbox Geocoding API                            |
| Styling            | Bootstrap 5, custom CSS, Font Awesome icons                          |
| Misc               | `method-override` (PUT/DELETE from forms), `connect-flash`, `dotenv` |

---

## Project structure

```
.
├── app.js                  # App setup, middleware, routes, server start
├── schema.js               # Joi validation for listings and reviews
├── middlewares.js          # isLoggedIn, isOwner, isReviewAuthor
├── models/                 # Mongoose models: listing, review, user
├── routes/                 # listing, review and user routes
├── controller/             # Logic behind each route
├── views/                  # EJS pages
│   ├── layouts/            #   boilerplate layout
│   ├── includes/           #   navbar, footer, category slider, flash, form fields
│   ├── listings/           #   index, show, new, edit
│   └── users/              #   login, signup
├── public/
│   ├── css/                # style.css
│   └── js/                 # filters.js (slider), map.js (Mapbox), script.js
├── utils/                  # categories, amenities, geocoding, sample reviews, helpers
├── scripts/                # backfill, addReviews, check
└── init/                   # Sample data and the seed script
```

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- [MongoDB](https://www.mongodb.com/try/download/community) running locally, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) database
- A free [Mapbox](https://account.mapbox.com/) account for the map (optional, see below)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env        # on Windows (Command Prompt): copy .env.example .env
# then open .env and fill in the values

# 4. (Optional) load sample listings
npm run seed

# 5. Start the app
npm start
```

Open **http://localhost:8080**.

### Environment variables

Set these in a file called `.env` in the project root. **Never commit this file.**

| Variable         | Required    | Description                                                                                               |
| ---------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| `MONGO_URL`      | No          | Local MongoDB address. Defaults to `mongodb://127.0.0.1:27017/wanderlust`.                                |
| `ATLASDB_URL`    | No          | MongoDB Atlas connection string. Used instead of `MONGO_URL` when set.                                    |
| `SECRET`         | Recommended | A long random string used to sign login sessions.                                                         |
| `PORT`           | No          | Port to run on. Defaults to `8080`.                                                                       |
| `MAP_TOKEN`      | For maps    | Your Mapbox **public** access token (starts with `pk.`). Without it the app works, but the map is hidden. |
| `SAMPLE_REVIEWS` | No          | Set to `off` to stop sample reviews being added automatically on start.                                   |

---

## Scripts

| Command            | What it does                                                                      |
| ------------------ | --------------------------------------------------------------------------------- |
| `npm start`        | Starts the app.                                                                   |
| `npm run seed`     | Resets listings to the sample data (**deletes existing listings first**).         |
| `npm run backfill` | Adds categories, amenities and map coordinates to older listings. Keeps all data. |
| `npm run reviews`  | Adds sample reviews so every listing has 4-5. Safe to run again.                  |
| `npm run check`    | Quick smoke test that checks modules and views load. No database needed.          |

---

## Routes

| Method     | Path                                  | Description                                 | Login needed       |
| ---------- | ------------------------------------- | ------------------------------------------- | ------------------ |
| GET        | `/listings`                           | All listings                                | No                 |
| GET        | `/listings/search?q=...`              | Search listings                             | No                 |
| GET        | `/listings/filter/:category`          | Filter by category (also `Trending`, `New`) | No                 |
| GET        | `/listings/:id`                       | Listing details, amenities, map and reviews | No                 |
| GET / POST | `/listings/new`, `/listings`          | New listing form / create                   | Yes                |
| GET / PUT  | `/listings/:id/edit`, `/listings/:id` | Edit form / update                          | Owner only         |
| DELETE     | `/listings/:id`                       | Delete a listing                            | Owner only         |
| POST       | `/listings/:id/reviews`               | Add a review                                | Yes                |
| DELETE     | `/listings/:id/reviews/:reviewId`     | Delete a review                             | Review author only |
| GET / POST | `/signup`, `/login`                   | Create account / log in                     | No                 |
| GET        | `/logout`                             | Log out                                     | Yes                |

---

## Notes

- **Sample reviewers** are fake accounts created for demo purposes. They are given random passwords nobody knows, so nobody can log in as them. Disable them with `SAMPLE_REVIEWS=off`.
- **Map token:** only ever put a Mapbox **public** token (`pk.`) in `.env`. It is sent to the browser by design, so restrict it to your own site URLs in the Mapbox dashboard before deploying.
- **Images:** listings use an image URL that the host pastes in. Direct file uploads are not implemented yet.

---

## Roadmap

- Image uploads (for example with Cloudinary)
- Booking and availability calendar
- Wishlist / favourites
- Filters by price range and number of guests
- Automated tests

---

## Author

**Tejasvi** - Computer Science student, IGDTUW
