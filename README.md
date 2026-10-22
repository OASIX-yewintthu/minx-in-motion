# MINX IN MOTION

### FRAME / SHIFT — A Cinematic Portfolio Experience

> Every frame has a story. I find the rhythm in between.

**MINX IN MOTION** is a custom-built portfolio website for **Minx (Thawtar San)**, a freelance video editor and content creator based in Yangon, Myanmar.

Created to reflect the language of film and editing, the site turns a traditional portfolio into a visual journey: cinematic reveals, scroll-driven compositions, dynamic transitions, and the work itself take center stage.

## Highlights

- **Cinematic introduction** — An animated opening identity with image-readiness handling and a skip option.
- **Scroll-driven storytelling** — Layered portrait reveals, floating frames, and an editorial timeline-inspired scene.
- **Video project showcase** — Ten portfolio projects across creative edits, product videos, and educational content, with project previews and full video playback.
- **Interactive details** — Responsive hover, pointer, and button feedback, plus transitions that complement the visual direction.
- **Motion control** — A persistent Motion On/Off preference that also respects the visitor's system reduced-motion setting.
- **Responsive experience** — Layouts and interactions adapted for desktop and mobile screens.
- **Thoughtful media handling** — Project posters, on-demand preview playback, and locally hosted video assets.

## Built With

- **HTML5** — Semantic structure and native video elements.
- **CSS3** — Responsive layouts, typography, visual effects, and transitions.
- **Vanilla JavaScript** — Navigation, project interactions, scroll scenes, and playback behavior.
- **Web Animations API, `requestAnimationFrame`, and `IntersectionObserver`** — Motion sequences, scroll rendering, and media visibility handling.

The site is a static project with **no front-end framework or build step required**.

## Project Structure

```text
minx-in-motion/
├── index.html          # Main page and content structure
├── style.css           # Base design and responsive styles
├── refinements.css     # Motion and interaction refinements
├── projects.js         # Project metadata
├── app.js              # Main site behavior and gallery
├── refinements.js      # Introduction and microinteractions
├── assets/             # Portraits, posters, previews, and videos
└── README.md
```

## Run Locally

Clone the repository:

```bash
git clone https://github.com/OASIX-yewintthu/minx-in-motion.git
cd minx-in-motion
```

Start any local static server. For example, with Python 3:

```bash
python3 -m http.server 8000
```

Then open **http://localhost:8000** in your browser.

No dependency installation or compilation is necessary.

## Deploy with GitHub Pages

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose **`main`** and **`/(root)`**, then save.

The website uses `index.html` at the repository root and can be served as a static site.

## Credits

- **Portfolio subject and featured creative work:** Minx (Thawtar San)
- **Website design and development:** Vinni — [GitHub](https://github.com/OASIX-yewintthu)

## Content & Usage

This repository presents a personal creative portfolio. Its photographs, videos, and other featured media are for portfolio display; please obtain permission from the relevant rights holders before copying, redistributing, or reusing them.

---

*MINX IN MOTION — a portfolio designed to be experienced, not just viewed.*
