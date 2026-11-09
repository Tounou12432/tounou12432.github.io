// Post-build checks on _site/: broken internal links/assets, missing anchors,
// unlabeled icon-only links, images without alt. Placeholders are reported, not failed.
// Run: npm run check   (after npm run build; honours PATH_PREFIX like the build)
import fs from "node:fs";
import path from "node:path";

const OUT = "_site";
const prefix = (process.env.PATH_PREFIX || "/").replace(/\/?$/, "/");
const errors = [];
let placeholders = 0;

const htmlFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? htmlFiles(p) : p.endsWith(".html") ? [p] : [];
  });

const files = fs.existsSync(OUT) ? htmlFiles(OUT) : [];
if (!files.length) {
  console.error("No HTML in _site/. Run `npm run build` first.");
  process.exit(1);
}

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(OUT, file);
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

  for (const [, attr, url] of html.matchAll(/\s(href|src|srcset)="([^"]*)"/g)) {
    for (const raw of attr === "srcset" ? url.split(",").map((s) => s.trim().split(/\s+/)[0]) : [url]) {
      if (!raw) { errors.push(`${rel}: empty ${attr}`); continue; }
      if (/^(https?:|mailto:|tel:|data:)/.test(raw)) continue;
      if (raw.startsWith("#")) {
        if (raw.length > 1 && !ids.has(raw.slice(1))) errors.push(`${rel}: missing anchor ${raw}`);
        continue;
      }
      if (!raw.startsWith(prefix)) { errors.push(`${rel}: path not under prefix ${prefix}: ${raw}`); continue; }
      const target = path.join(OUT, decodeURIComponent(raw.slice(prefix.length).split(/[?#]/)[0]));
      const ok = fs.existsSync(target) &&
        (fs.statSync(target).isFile() || fs.existsSync(path.join(target, "index.html")));
      if (!ok) errors.push(`${rel}: broken link ${raw}`);
    }
  }

  for (const [, attrs, inner] of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    if (!text && !/aria-label="[^"]+"/.test(attrs)) errors.push(`${rel}: link without text or aria-label: <a${attrs}>`);
  }
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(tag)) errors.push(`${rel}: <img> without alt: ${tag.slice(0, 80)}`);
  }
  placeholders += (html.match(/class="ph"/g) || []).length;
}

console.log(`Checked ${files.length} page(s) with prefix "${prefix}".`);
if (placeholders) console.log(`! ${placeholders} placeholder(s) still on the site. Search src/ for "[[".`);
if (errors.length) {
  console.error(`x ${errors.length} problem(s):\n  ` + errors.join("\n  "));
  process.exit(1);
}
console.log("OK: no broken links, missing anchors, unlabeled icon links or images without alt.");
