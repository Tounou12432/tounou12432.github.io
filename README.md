# Portfolio

A personal portfolio built with [Eleventy](https://www.11ty.dev/) (a static site generator). It is hosted for free on GitHub Pages and has no database, server or paid service.

## Preview locally

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm install      # first time only
npm start        # opens a live preview at http://localhost:8080 and reloads as you edit
npm test         # builds the site, then checks links, anchors, alt text and icon labels
```

## Update your content

All content lives in `src/`. You never need to touch the layout files to change text.

| What | File |
|---|---|
| Name, title, tagline, location, email, social links, CV path | `src/_data/site.yaml` |
| About section (Markdown) | `src/content/about.md` |
| Projects, one file per project | `src/projects/*.md` |
| CV sections (experience, leadership, education, awards) and skills | `src/_data/cv.yaml` |
| Full archive page (`/archive/`), extra rows | `src/_data/archive.yaml` |
| CV PDF | `src/assets/files/cv.pdf` |
| Profile photo | `src/assets/img/src/profile.jpg` (square, 400 px or larger) |
| Project images (originals) | `src/assets/img/src/` |

The archive page lists every highlight project automatically, plus the rows in `archive.yaml`, newest first. Each row's `category` drives the filter buttons.

**Placeholders.** Any text written `[[like this]]` is a placeholder. It shows with a dashed yellow outline on the site. Replace it with your own text and delete the brackets. `npm test` reports how many placeholders are left, and you can search `src/` for `[[` to find them.

**Projects.** To add a project, copy `src/projects/01-example-project.md`, rename it, and edit the front matter:
- `order` sets the position in the list, `draft: true` hides a project, and `results` and `links` are optional.
- Work with no code or screenshots fits too: leave `thumbnail` and `links` empty.
- **Images:** put the original in `src/assets/img/src/` and set `thumbnail: "assets/img/src/name.jpg"` and `thumbnail_alt`. The build makes resized AVIF, WebP and JPEG versions automatically.
- **A page of its own:** set `detail_page: true`. The text below the front matter becomes `/projects/<file-name>/`, and the card links to it.

**Social icons.** Add only the profiles you use under `socials:` in `site.yaml`. `network` is a [Simple Icons](https://simpleicons.org) slug, such as `github`, `x`, `instagram` or `behance`. LinkedIn is not in Simple Icons, so `src/assets/icons/linkedin.svg` holds the official LinkedIn In-Bug from brand.linkedin.com, wrapped so it takes the icon colour. All other icons come from Lucide. The email icon and the "Get in touch" link appear once `email` is set.

**CV download.** The "Download CV" link appears only when `src/assets/files/cv.pdf` exists. To regenerate the PDF after editing `cv.yaml`, run `npm start`, open http://localhost:8080/cv/print/, choose Print → Save as PDF (A4, no headers/footers), and save it over `src/assets/files/cv.pdf`.

## Publish on GitHub Pages (free)

1. Create a **public** repository on GitHub. Its name sets your URL:
   - `<username>.github.io` gives `https://<username>.github.io/`
   - any other name, such as `portfolio`, gives `https://<username>.github.io/portfolio/`
2. Push this folder to the repository's `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin main
   ```
3. On GitHub, open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
4. The workflow in `.github/workflows/deploy.yml` then builds, checks and publishes the site on every push to `main`. It sets the correct path prefix for either URL type automatically. Follow the progress in the **Actions** tab.
5. Optional: set `url:` in `site.yaml` to your final address, for link previews. To use a custom domain, add it under Settings → Pages.

To test the project-site paths locally, build with a prefix:

```bash
PATH_PREFIX=/portfolio/ npm test
```

## Image credits

The landmark outlines in the left column (`src/_includes/scene.njk`) were traced from photos:

- Pha That Luang: "Pha That Luang, July 2023" on Wikimedia Commons, CC0.
- Patuxai: "ประตูชัย (กำแพงนครเวียงจันทน์) - panoramio" by มะเดื่อ แสลงหลวง on Wikimedia Commons, [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). The credit also appears in the scene caption, as the licence requires.
- Vang Vieng: "Nam song river vang vieng" on Wikimedia Commons, public domain.
