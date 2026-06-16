# komalboyo.github.io

Personal website of **Komal Mathur** — AI researcher, software developer, and writer.
Live at **[komalboyo.github.io](https://komalboyo.github.io)**.

A single-page bio site with sections for education, experience, research/publications,
awards, projects, and skills, plus an "Opinions" section linking to a small collection
of essays. Includes a few interactive touches: a three-way theme toggle (light → dark →
disco, with neon glows and 3D tilt), a "temperature" slider that progressively reveals
essay text, and a mobile nav menu.

## Tech Stack

- **Static HTML / CSS / vanilla JavaScript** — no framework, no build step.
- Fonts: Newsreader + Inter (Google Fonts).
- **GitHub Pages** for hosting (served from the repo root of a `*.github.io` repo).

Structure:

```
index.html        # main single-page site
styles.css        # all styling, incl. light/dark/disco themes
script.js         # theme toggle, mobile menu, temp slider, disco effects
favicon.svg       # KM monogram logo
Komal_CV_Jan26.pdf
essays/           # standalone essay pages (HTML)
writing_style.md  # personal writing style notes
```

## Run & Deploy

It's a static site, so no toolchain is required.

**Local preview** — open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

**Deploy** — push to `main`; GitHub Pages publishes the repo root automatically:

```bash
git push origin main
```

## Status

Live and active. Most recent commit: **March 2026** (added the disco theme; before that, a
run of design/accessibility fixes). Experience and essay content reflects early-to-mid 2026.
No secrets in the repo — it's purely static front-end code.
