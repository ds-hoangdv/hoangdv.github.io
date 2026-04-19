# Viet-Hoang Dong — Personal Website

Static, serif-academic personal site with cream/navy warm-scholar palette and
dark mode. Pure HTML / CSS / JS — zero build step, zero dependencies. Ships on
GitHub Pages in minutes.

## Structure

```
ProfileLandingPage/
├── index.html         # Home — bio, research interests, selected pubs & projects, news
├── research.html      # Research themes, full publications, advisors, achievements
├── projects.html      # Ventures, research and industry projects
├── cv.html            # Full CV (download PDF link)
├── blog.html          # Placeholder for future writing
├── README.md
└── assets/
    ├── css/styles.css
    ├── js/main.js
    ├── cv/HoangDV_CV_2026.pdf
    └── img/profile.jpg   # drop your portrait here (optional)
```

## Customising

- **Profile photo.** Drop a square photo at `assets/img/profile.jpg`. If the file
  is missing, the hero falls back to the initials "VHD".
- **CV PDF.** Replace `assets/cv/HoangDV_CV_2026.pdf` when you have a new version;
  the download link in `cv.html` points at that exact path.
- **Publication links.** The `Paper / Code / BibTeX` links in `index.html` and
  `research.html` are currently stubs (`#`). Point them at arXiv, proceedings,
  and GitHub repos as they become available.
- **News.** Edit the `<ul class="news">` block in `index.html` to add new entries.
- **Theme.** Palette is defined as CSS custom properties at the top of
  `assets/css/styles.css` — light theme in `:root`, dark theme in
  `[data-theme="dark"]`. Change the two blocks to retheme the whole site.
- **Blog.** When you're ready, replace the "Coming soon" callout in `blog.html`
  with a list of posts (the `.pub-list` pattern already used on the page works).

## Running locally

No build step — just open the files. For a clean local preview:

```bash
cd ProfileLandingPage
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying to GitHub Pages

### Option A — user site at `ericdong.github.io`

1. Create a repo named exactly `EricDong.github.io`.
2. Copy the contents of `ProfileLandingPage/` into the repo root so that
   `index.html` sits at the top level.
3. Push to `main`:
   ```bash
   git init
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin git@github.com:EricDong/EricDong.github.io.git
   git push -u origin main
   ```
4. On GitHub → `Settings` → `Pages`, set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`.
5. Site is live at `https://ericdong.github.io` in a minute or so.

### Option B — project site (any repo)

1. Push this folder to any repo.
2. On GitHub → `Settings` → `Pages`, set **Source** to `Deploy from a branch`,
   pick the branch and folder containing `index.html`.
3. Site is live at `https://ericdong.github.io/<repo-name>/`.

### Custom domain (optional)

Add a `CNAME` file at the project root containing your domain
(e.g. `hoangdong.com`), then configure the DNS `CNAME` record to point at
`ericdong.github.io`.

## Browser support

Modern evergreen browsers (Chrome, Safari, Firefox, Edge). Uses
`color-mix()` and `backdrop-filter` — both widely supported as of 2024+.

## License

Content © 2026 Viet-Hoang Dong. Feel free to reuse the template structure.
