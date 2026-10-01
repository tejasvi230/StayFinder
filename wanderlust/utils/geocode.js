// Turns a place name ("Malibu, United States") into GeoJSON coordinates using the
// Mapbox Geocoding API. Returns null (never throws) if anything goes wrong, so a
// map problem can never stop a listing from being saved or shown.

async function geocode(query) {
  const token = process.env.MAP_TOKEN;
  if (!token || !query) return null;

  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "1");
  url.searchParams.set("access_token", token);

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) {
      console.warn(`Mapbox geocoding failed (${res.status}) for "${query}"`);
      return null;
    }
    const data = await res.json();
    const coords = data.features?.[0]?.geometry?.coordinates;
    if (Array.isArray(coords) && coords.length === 2) {
      return { type: "Point", coordinates: coords }; // [longitude, latitude]
    }
    return null;
  } catch (err) {
    console.warn(`Mapbox geocoding error for "${query}":`, err.message);
    return null;
  }
}

module.exports = geocode;
