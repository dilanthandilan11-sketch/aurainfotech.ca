# Copilot Instructions for Aura Website Project

## Project Overview
- This is a Next.js project (App Router) bootstrapped with `create-next-app`.
- Main UI and logic are in `src/app/` (global styles, layout, main page) and `src/components/scene/` (custom 3D/visual components).
- Public assets (fonts, models, HDRIs) are in `public/`.

## Key Patterns & Structure
- **App Entry:** `src/app/page.js` is the main landing page. `src/app/layout.js` defines the global layout.
- **Styling:** Uses CSS modules (e.g., `page.module.css`, `sceneText.css`) and global CSS (`globals.css`).
- **3D/Visual Components:** All 3D/scene logic is in `src/components/scene/` (e.g., `Scene.jsx`, `Starfield.jsx`, `HandTracking.jsx`).
- **Assets:**
  - Fonts: `public/fonts/`, loaded via `public/fonts.css`.
  - 3D Models: `public/models/`
  - HDRI: `public/hdri/`

## Developer Workflows
- **Development:**
  - Start: `npm run dev` (default port 3000)
  - Main dev file: `src/app/page.js`
- **Preview:**
  - Use `npm run build` then `npm run start` for production preview.
  - `npm preview` is not standard for Next.js; use `npm run start` after build.
- **Build:**
  - `npm run build` (outputs to `.next/`)
- **No custom test scripts or CI/CD found.**

## Conventions & Integration
- **Component Structure:**
  - Scene-related components are colocated in `src/components/scene/`.
  - Use functional React components (see `Scene.jsx`, `Artifact.jsx`).
- **No Redux, MobX, or other state libraries detected.**
- **No API routes or backend logic in this repo.**
- **External dependencies:**
  - Next.js, React, and likely 3D/visual libraries (check `package.json` for details).

## Examples
- To add a new 3D scene, create a new component in `src/components/scene/` and import it in `src/app/page.js`.
- To update global styles, edit `src/app/globals.css`.
- To add a new font, place it in `public/fonts/` and update `public/fonts.css`.

## References
- [src/app/page.js] — main entry point
- [src/components/scene/Scene.jsx] — main 3D scene logic
- [public/fonts.css] — font loading

---
For more, see the project README.md or Next.js docs. If conventions or structure are unclear, ask for clarification or check for updates in this file.
