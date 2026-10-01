// Category slider: arrow buttons, edge detection, and scrolling the active item into view.
(function () {
  const wrap = document.getElementById("sfFilters");
  const track = document.getElementById("sfFilterTrack");
  if (!wrap || !track) return;

  const prev = wrap.querySelector(".sf-filter-prev");
  const next = wrap.querySelector(".sf-filter-next");

  function updateArrows() {
    const maxScroll = track.scrollWidth - track.clientWidth;
    prev.hidden = track.scrollLeft <= 4;
    next.hidden = track.scrollLeft >= maxScroll - 4;
  }

  function slide(direction) {
    track.scrollBy({ left: direction * track.clientWidth * 0.7, behavior: "smooth" });
  }

  prev.addEventListener("click", () => slide(-1));
  next.addEventListener("click", () => slide(1));
  track.addEventListener("scroll", updateArrows, { passive: true });
  window.addEventListener("resize", updateArrows);

  // Keep the selected category visible (e.g. "Historical Homes" at the far end).
  const active = track.querySelector(".sf-filter.active");
  if (active) {
    const target = active.offsetLeft - (track.clientWidth - active.offsetWidth) / 2;
    track.scrollLeft = Math.max(0, target);
  }
  updateArrows();
})();
