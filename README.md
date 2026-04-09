# OMNI Landing Page & Developer Journal

This repository contains the official landing page and developer journal for **OMNI**, the Semantic Signal Engine for Agentic AI. 

Built with **Astro v6**, this site is designed for high performance, premium aesthetics, and search engine optimization (SEO).

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
3. **Build for production:**
   ```bash
   npm run build
   ```

## 📂 Project Structure

- `src/layouts/`: Core page wrappers (handles SEO meta tags, OG, and Twitter cards).
- `src/components/`: Reusable UI elements (Navbar, Footer, etc.).
- `src/pages/`: Route definitions (Home, Blog, [Slug]).
- `src/content/`: Main content data.
- `public/`: Static assets (images, logos, robots.txt).

---

## ✍️ Content & Blog Management

The OMNI Journal uses Astro's **Content Collections** with the `glob` loader.

### Adding a New Article

When a new update is released in the [OMNI CHANGELOG](https://github.com/fajarhide/omni/blob/main/CHANGELOG.md), you should create a corresponding story-driven article here.

1. Create a new `.md` file in `src/content/blog/`.
2. Use the following frontmatter template for SEO best practices:

```markdown
---
title: "OMNI Update vX.X.X: The Narrative Title"
description: "A compelling 1-2 sentence hook that summarizes the update for search engines and social previews."
date: 2026-04-09
tag: "Release"
author: "OMNI Core Team"
featured: false
---

# The Story Behind the Update

[Content goes here. Use standard Markdown.]
```

### SEO Best Practices for Articles
- **Title**: Keep it catchy but descriptive (~50-60 characters).
- **Description**: This becomes the `meta description` and social preview. Use active voice.
- **Slug**: The filename (e.g., `omni-update-v0-5-0.md`) becomes the URL slug (`/blog/omni-update-v0-5-0`). Keep it clean.
- **Content**: Use proper heading hierarchy (`h2`, `h3`) and include key semantic terms related to AI agents, token savings, and context distillation.

## 🛠 Tech Stack
- **Framework:** [Astro](https://astro.build)
- **Styling:** Vanilla CSS (Modern CSS variables & Grid)
- **Deployment:** [Vercel](https://vercel.com)
- **SEO:** Automated Sitemap, Robots.txt, and Meta Tag generation.

---

Built with ❤️ by [Fajar Hidayat](https://github.com/fajarhide).
