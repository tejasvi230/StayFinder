// Shows the listing on a Mapbox map. The data comes from window.STAYFINDER_MAP,
// which the listing page fills in (token, coordinates as [lng, lat], title).
(function () {
  const data = window.STAYFINDER_MAP;
  const container = document.getElementById("map");
  if (!data || !container || typeof mapboxgl === "undefined") return;

  const map = new mapboxgl.Map({
    accessToken: data.token,
    container: "map",
    style: "mapbox://styles/mapbox/streets-v12",
    center: data.coordinates,
    zoom: 10,
    cooperativeGestures: true, // page scrolls normally; Ctrl + scroll zooms the map
  });

  // Build the popup with DOM nodes (not HTML strings) so a listing title can't inject code.
  const popupBox = document.createElement("div");
  popupBox.className = "map-popup";
  const popupTitle = document.createElement("strong");
  popupTitle.textContent = data.title;
  const popupNote = document.createElement("p");
  popupNote.textContent = "Exact location is shared after booking.";
  popupBox.append(popupTitle, popupNote);

  new mapboxgl.Marker({ color: "#ff385c" })
    .setLngLat(data.coordinates)
    .setPopup(new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupBox))
    .addTo(map);

  map.addControl(new mapboxgl.NavigationControl(), "top-right");
  map.addControl(new mapboxgl.ScaleControl());
})();
