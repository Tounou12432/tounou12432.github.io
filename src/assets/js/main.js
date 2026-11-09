const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Cursor spotlight: CSS shows it only for fine pointers with motion allowed; this just feeds the position.
if (!calm) {
  const spot = document.querySelector(".spotlight");
  if (spot) window.addEventListener("pointermove", (e) => {
    spot.style.setProperty("--x", `${e.clientX}px`);
    spot.style.setProperty("--y", `${e.clientY}px`);
  }, { passive: true });
}

// Soft reveal of entries. Content stays visible if JS or IntersectionObserver is missing.
if (!calm && "IntersectionObserver" in window) {
  document.documentElement.classList.add("js-reveal");
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

// Archive filters (only on /archive/). Buttons stay hidden without JS, so all rows show.
(() => {
  const group = document.querySelector(".filters");
  if (!group) return;
  const rows = [...document.querySelectorAll(".archive-table tbody tr")];
  const count = document.querySelector(".archive-count");
  const apply = (cat) => {
    let shown = 0;
    for (const r of rows) { const on = cat === "all" || r.dataset.category === cat; r.hidden = !on; shown += on; }
    for (const b of group.querySelectorAll("button")) b.setAttribute("aria-pressed", String(b.dataset.filter === cat));
    if (count) count.textContent = `Showing ${shown} of ${rows.length}`;
  };
  // Hide filters for categories with no rows.
  for (const b of group.querySelectorAll("button[data-filter]:not([data-filter='all'])")) {
    if (!rows.some((r) => r.dataset.category === b.dataset.filter)) b.remove();
  }
  group.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) apply(b.dataset.filter); });
  group.hidden = false;
  apply("all");
})();

// Scroll-spy: highlight the nav item for the section currently in view.
// The site works fully without this script; it only adds the active state.
(() => {
  const links = [...document.querySelectorAll("a[data-nav]")];
  const sections = [...new Set(links.map((a) => a.hash))]
    .map((hash) => document.querySelector(hash))
    .filter(Boolean);
  if (!sections.length) return;

  const scene = document.querySelector(".scene");
  const root = document.documentElement;
  let current = "";
  const setActive = (id) => {
    if (id === current) return;
    current = id;
    for (const a of links) {
      const on = a.hash === `#${id}`;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    }
    if (scene) scene.dataset.active = id;
  };

  const clamp = (n) => Math.min(1, Math.max(0, n));
  const update = () => {
    const atBottom = window.innerHeight + window.scrollY >= root.scrollHeight - 2;
    const line = window.innerHeight * 0.3;
    let active = sections[0].id;
    const progress = {};
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= line) active = s.id;
      progress[s.id] = atBottom ? 1 : clamp((line - r.top) / Math.max(r.height, 1));
    }
    if (atBottom) active = sections.at(-1).id;
    setActive(active);

    // Reading progress on each nav line, and how much of the current scene is drawn.
    for (const a of links) a.style.setProperty("--p", progress[a.hash.slice(1)].toFixed(3));
    if (scene) scene.style.setProperty("--draw", calm ? 1 : clamp(0.15 + progress[active] / 0.55).toFixed(3));
    root.classList.toggle("is-compact", window.scrollY > 80);
  };

  // Short screens: if the left column overflows even at the top, fold the location and contact
  // sentence so the social icons stay visible. Measured on load/resize only, to avoid flicker.
  const intro = document.querySelector(".intro");
  const fit = () => {
    if (!intro) return;
    root.classList.remove("is-tight");
    if (intro.scrollHeight > intro.clientHeight + 1) root.classList.add("is-tight");
  };
  fit();
  window.addEventListener("resize", fit, { passive: true });

  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; update(); });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
})();
