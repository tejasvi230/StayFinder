// The category slider, in display order. `virtual` ones (Trending, New) aren't stored on a
// listing - they're worked out when the page loads.

const FILTERS = [
  { name: "Rooms", icon: "bed" },
  { name: "Iconic Cities", icon: "city" },
  { name: "Trending", icon: "fire", virtual: true },
  { name: "Mountains", icon: "mountain" },
  { name: "Castles", icon: "chess-rook" },
  { name: "Amazing Pools", icon: "water-ladder" },
  { name: "Camping", icon: "campground" },
  { name: "Farm", icon: "tractor" },
  { name: "Arctic", icon: "snowflake" },
  { name: "Beach", icon: "umbrella-beach" },
  { name: "Boat", icon: "sailboat" },
  { name: "Ski-in/out", icon: "person-skiing" },
  { name: "Apartment", icon: "building" },
  { name: "New", icon: "wand-magic-sparkles", virtual: true },
  { name: "Woodlands", icon: "tree" },
  { name: "Lake", icon: "water" },
  { name: "Cabins", icon: "house-chimney" },
  { name: "Countryside", icon: "wheat-awn" },
  { name: "Bed & Breakfasts", icon: "mug-hot" },
  { name: "Campsite", icon: "tent" },
  { name: "Historical Homes", icon: "landmark" },
];

// "Iconic Cities" -> "Iconic-Cities", "Ski-in/out" -> "Ski-in-out", "Bed & Breakfasts" -> "Bed-and-Breakfasts"
const toSlug = (name) => name.replace(/&/g, "and").replace(/[\s/]+/g, "-");

const SLIDER_FILTERS = FILTERS.map((f) => ({ ...f, slug: toSlug(f.name) }));

// The categories a listing can actually be tagged with.
const CATEGORIES = FILTERS.filter((f) => !f.virtual).map((f) => f.name);

function findFilterBySlug(slug = "") {
  const wanted = String(slug).toLowerCase();
  return SLIDER_FILTERS.find((f) => f.slug.toLowerCase() === wanted) || null;
}

// Keyword rules used to tag sample data and old listings. A listing can match several.
const RULES = [
  [/castle/, ["Castles", "Historical Homes"]],
  [/histor|heritage|villa in tuscany|brownstone|canal house/, ["Historical Homes"]],
  [/treehouse|woodland|forest|log cabin/, ["Woodlands"]],
  [/lake/, ["Lake"]],
  [/beach|island|bungalow|maldives|mykonos/, ["Beach"]],
  [/ski|chalet/, ["Ski-in/out", "Mountains"]],
  [/mountain|banff|aspen/, ["Mountains"]],
  [/cabin/, ["Cabins"]],
  [/cottage|cotswolds|countryside/, ["Countryside", "Rooms"]],
  [/safari|camp|lodge/, ["Camping"]],
  [/campsite/, ["Campsite"]],
  [/villa|pool/, ["Amazing Pools"]],
  [/apartment|loft|penthouse/, ["Apartment", "Rooms"]],
  [/loft|penthouse|downtown|city|tokyo|miami|boston|new york|amsterdam|dubai|los angeles|brownstone|canal/, ["Iconic Cities"]],
  [/farm|ranch/, ["Farm"]],
  [/arctic|igloo|aurora/, ["Arctic"]],
  [/boat|yacht/, ["Boat"]],
  [/bed (&|and) breakfast|b&b/, ["Bed & Breakfasts"]],
];

function suggestCategories(listing) {
  const title = (listing.title || "").toLowerCase();
  const text = `${title} ${(listing.description || "").toLowerCase()}`;
  const collect = (source) => {
    const found = new Set();
    for (const [re, cats] of RULES) if (re.test(source)) cats.forEach((c) => found.add(c));
    return [...found];
  };
  // Titles are the most reliable signal; fall back to the description.
  const found = collect(title);
  const result = found.length ? found : collect(text);
  return result.length ? result : ["Rooms"];
}

// Old single-value categories from the previous version -> the new names.
const LEGACY_MAP = {
  Beachfront: "Beach",
  Lakefront: "Lake",
  Farms: "Farm",
  Treehouses: "Woodlands",
};
const fromLegacy = (value) => {
  if (!value) return null;
  const mapped = LEGACY_MAP[value] || value;
  return CATEGORIES.includes(mapped) ? mapped : null;
};

module.exports = {
  FILTERS: SLIDER_FILTERS,
  CATEGORIES,
  toSlug,
  findFilterBySlug,
  suggestCategories,
  fromLegacy,
};
