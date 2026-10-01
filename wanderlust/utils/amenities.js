// Single source of truth for listing categories and amenities.
// Each amenity is stored on a listing as its `key`; label/icon/note are for display only.

const { CATEGORIES, suggestCategories } = require("./categories.js");

const AMENITY_GROUPS = [
  {
    name: "Basics",
    items: [
      { key: "wifi", label: "Wifi", icon: "wifi" },
      { key: "kitchen", label: "Kitchen", icon: "utensils" },
      { key: "parking", label: "Free parking on premises", icon: "square-parking" },
      { key: "ac", label: "Air conditioning", icon: "snowflake" },
      { key: "tv", label: "TV", icon: "tv" },
      { key: "security-cameras", label: "Security cameras on property", icon: "video" },
    ],
  },
  {
    name: "Scenic views",
    items: [
      { key: "lake-view", label: "Lake view", icon: "water" },
      { key: "mountain-view", label: "Mountain view", icon: "mountain" },
      { key: "pool-view", label: "Pool view", icon: "water-ladder" },
    ],
  },
  {
    name: "Bathroom",
    items: [
      { key: "cleaning-products", label: "Cleaning products", icon: "spray-can-sparkles" },
      { key: "shampoo", label: "Shampoo", icon: "pump-soap" },
      { key: "hot-water", label: "Hot water", icon: "temperature-high" },
    ],
  },
  {
    name: "Bedroom and laundry",
    items: [
      { key: "essentials", label: "Essentials", icon: "toilet-paper", note: "Towels, bed sheets, soap and toilet paper" },
      { key: "hangers", label: "Hangers", icon: "shirt" },
      { key: "bed-linen", label: "Bed linen", icon: "bed" },
    ],
  },
  {
    name: "Entertainment",
    items: [
      { key: "tv-cable", label: "TV with standard cable/satellite", icon: "tv" },
      { key: "sound-system", label: "Sound system with Bluetooth and aux", icon: "volume-high" },
      { key: "pool-table", label: "Pool table", icon: "table-cells" },
    ],
  },
  {
    name: "Outdoor",
    items: [
      { key: "patio-balcony", label: "Patio or balcony", icon: "door-open" },
      { key: "garden", label: "Garden", icon: "seedling" },
      { key: "hammock", label: "Hammock", icon: "umbrella-beach" },
      { key: "firepit", label: "Firepit", icon: "fire" },
      { key: "bbq-grill", label: "BBQ grill", icon: "fire-burner" },
    ],
  },
  {
    name: "Kitchen and dining",
    items: [
      { key: "dishes-cutlery", label: "Dishes and cutlery", icon: "plate-wheat" },
      { key: "bbq-utensils", label: "Barbecue utensils", icon: "burger" },
      { key: "dining-table", label: "Dining table", icon: "chair" },
      { key: "freezer", label: "Freezer", icon: "icicles" },
    ],
  },
  {
    name: "Location features",
    items: [
      { key: "waterfront", label: "Waterfront", icon: "water", note: "Right next to a body of water" },
      { key: "lake-access", label: "Lake access", icon: "sailboat", note: "Guests can get to a lake using a path or dock" },
      { key: "private-entrance", label: "Private entrance", icon: "door-closed", note: "Separate street or building entrance" },
    ],
  },
];

const AMENITY_KEYS = AMENITY_GROUPS.flatMap((g) => g.items.map((i) => i.key));

// Returns only the groups that contain at least one of the listing's amenities.
function groupAmenities(selectedKeys = []) {
  const selected = new Set(selectedKeys);
  return AMENITY_GROUPS.map((group) => ({
    name: group.name,
    items: group.items.filter((item) => selected.has(item.key)),
  })).filter((group) => group.items.length);
}

// Flat list in catalogue order (Basics first) - used for the "What this place offers" preview.
function orderedAmenities(selectedKeys = []) {
  return groupAmenities(selectedKeys).flatMap((g) => g.items);
}

// Sensible starting categories/amenities for sample data and for old listings
// that were created before these fields existed.
const BASE = ["wifi", "kitchen", "tv", "hot-water", "essentials", "hangers", "bed-linen", "shampoo", "cleaning-products", "dishes-cutlery"];
const EXTRA = {
  "Rooms": ["ac", "parking", "security-cameras", "private-entrance"],
  "Iconic Cities": ["ac", "security-cameras", "private-entrance", "sound-system", "dining-table"],
  "Mountains": ["parking", "mountain-view", "firepit", "patio-balcony", "freezer"],
  "Castles": ["parking", "garden", "dining-table", "pool-table", "firepit"],
  "Amazing Pools": ["ac", "parking", "pool-view", "garden", "bbq-grill", "sound-system", "security-cameras"],
  "Camping": ["parking", "firepit", "bbq-grill", "bbq-utensils", "security-cameras"],
  "Farm": ["parking", "garden", "firepit", "dining-table"],
  "Arctic": ["parking", "mountain-view", "firepit", "private-entrance"],
  "Beach": ["ac", "waterfront", "patio-balcony", "bbq-grill", "bbq-utensils", "hammock"],
  "Boat": ["waterfront", "lake-access", "bbq-grill", "hammock"],
  "Ski-in/out": ["parking", "mountain-view", "firepit", "private-entrance", "freezer"],
  "Apartment": ["ac", "security-cameras", "private-entrance", "dining-table"],
  "Woodlands": ["garden", "hammock", "patio-balcony", "parking", "firepit"],
  "Lake": ["parking", "lake-view", "lake-access", "waterfront", "hammock", "firepit", "bbq-grill"],
  "Cabins": ["parking", "firepit", "patio-balcony", "mountain-view"],
  "Countryside": ["parking", "garden", "patio-balcony", "dining-table"],
  "Bed & Breakfasts": ["parking", "ac", "dining-table", "private-entrance"],
  "Campsite": ["parking", "firepit", "bbq-grill", "bbq-utensils"],
  "Historical Homes": ["parking", "garden", "dining-table", "firepit"],
};

function suggestFor(listing) {
  const categories = suggestCategories(listing);
  const extras = categories.flatMap((c) => EXTRA[c] || []);
  return { categories, amenities: [...new Set([...BASE, ...extras])] };
}

module.exports = {
  CATEGORIES,
  AMENITY_GROUPS,
  AMENITY_KEYS,
  groupAmenities,
  orderedAmenities,
  suggestFor,
};
