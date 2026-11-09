import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";
import * as simpleIcons from "simple-icons";
import Image from "@11ty/eleventy-img";
import { HtmlBasePlugin, RenderPlugin } from "@11ty/eleventy";

const LUCIDE_DIR = "node_modules/lucide-static/icons";
const CUSTOM_ICON_DIR = "src/assets/icons";
const brandBySlug = new Map(
  Object.values(simpleIcons).filter((i) => i && i.slug).map((i) => [i.slug, i])
);

// Inline SVG icon. "brand:<slug>" = Simple Icons (or src/assets/icons/<slug>.svg override),
// anything else = Lucide icon name. Icons are decorative: the parent link carries the label.
function icon(name, cls = "icon") {
  const [kind, slug] = name.includes(":") ? name.split(":") : ["lucide", name];
  if (kind === "brand") {
    const custom = path.join(CUSTOM_ICON_DIR, `${slug}.svg`);
    if (fs.existsSync(custom)) {
      return fs.readFileSync(custom, "utf8")
        .replace("<svg", `<svg class="${cls}" aria-hidden="true" focusable="false"`);
    }
    const brand = brandBySlug.get(slug);
    // Brand missing from Simple Icons (e.g. LinkedIn) and no override: fall back to a generic link icon.
    if (!brand) return icon("link", cls);
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="${brand.path}"/></svg>`;
  }
  const file = path.join(LUCIDE_DIR, `${slug}.svg`);
  if (!fs.existsSync(file)) throw new Error(`Unknown Lucide icon: ${slug}`);
  return fs.readFileSync(file, "utf8")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/class="[^"]*"/, `class="${cls}" aria-hidden="true" focusable="false"`)
    .replace(/\s*\n\s*/g, " ")
    .trim();
}

export default function (eleventyConfig) {
  eleventyConfig.addDataExtension("yaml,yml", (contents) => yaml.load(contents));
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPlugin(RenderPlugin);
  eleventyConfig.ignores.add("src/content/**"); // rendered into sections via renderFile, not standalone pages
  eleventyConfig.addPassthroughCopy({ "src/assets/css": "assets/css", "src/assets/js": "assets/js" });
  eleventyConfig.addPassthroughCopy("src/assets/files");

  eleventyConfig.addShortcode("icon", icon);

  // Responsive, optimized thumbnail (AVIF/WebP + fallback) generated at build time.
  eleventyConfig.addShortcode("thumbnail", async function (src, alt, sizes = "(min-width: 640px) 200px, 100vw", cls = "project-thumb") {
    if (!src) return "";
    const metadata = await Image(path.join("src", src), {
      widths: [400, 800, 1280],
      formats: ["avif", "webp", "jpeg"],
      outputDir: "_site/assets/img/",
      urlPath: "/assets/img/",
    });
    return Image.generateHTML(metadata, {
      alt: alt || "",
      sizes,
      loading: "lazy",
      decoding: "async",
      class: cls,
    });
  });

  // True only when the file actually exists, so we never render a broken "Download CV" link.
  eleventyConfig.addFilter("fileExists", (p) => !!p && fs.existsSync(path.join("src", p)));

  // Wrap [[placeholder text]] in a visible marker so missing content is easy to spot.
  eleventyConfig.addTransform("placeholders", function (content) {
    if (!(this.page.outputPath || "").endsWith(".html")) return content;
    // Only touch text between tags, never attribute values.
    return content.replace(/>([^<]*)</g, (_, text) =>
      ">" + text.replace(/\[\[([^\]]+)\]\]/g, '<span class="ph" title="Placeholder — replace me">$1</span>') + "<"
    );
  });

  eleventyConfig.addCollection("projects", (api) =>
    api.getFilteredByGlob("src/projects/*.md")
      .filter((p) => !p.data.draft)
      .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99))
  );

  // Archive table rows: highlight projects + src/_data/archive.yaml, newest first.
  const yearKey = (y = "") => (/present/i.test(y) ? 9999 : Math.max(0, ...(String(y).match(/\d{4}/g) || []).map(Number)));
  eleventyConfig.addCollection("archiveRows", (api) => {
    const projects = api.getFilteredByGlob("src/projects/*.md").filter((p) => !p.data.draft).map((p) => ({
      year: p.data.year,
      title: p.data.title,
      org: p.data.org,
      role: (p.data.contribution || "").split(". ")[0],
      category: p.data.category || "Programme",
      url: p.data.detail_page ? p.url : p.data.links?.[0]?.url,
      highlight: true,
    }));
    const extra = api.getAll()[0]?.data.archive || [];
    return [...projects, ...extra].sort((a, b) => yearKey(b.year) - yearKey(a.year));
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    // Set by the GitHub Actions workflow: "/" for username.github.io, "/<repo>/" for project sites.
    pathPrefix: process.env.PATH_PREFIX || "/",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
}
