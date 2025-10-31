# Taylor’s Pantry(https://whynotshrutz-taylors-xmxh.bolt.host/)

A small, fast React + Vite + TypeScript app that finds recipes from TheMealDB based on ingredients or dish names.  
Designed as a minimal “what’s in my pantry” helper for busy evenings.


---

## Features

- Search by ingredient(s) (supports multi-ingredient intersection: `chicken rice`)
- Search by dish name (e.g., `biryani`, `lasagna`) — falls back to name search if ingredients return no results
- Chef’s Choice: random recipe (opens modal with full details)
- Fav/Unfav recipes stored in `localStorage`
- Recent searches (local history chips)
- Responsive layout (Tailwind CSS)
- Accessible basics: aria labels, modal, `aria-live` status regions

---

## Tech Stack

- React + TypeScript (Vite)
- Tailwind CSS
- TheMealDB public API (no auth)
- LocalStorage for favorites & history

---

## Local Development

```bash
# clone
git clone https://github.com/<your-username>/taylors-pantry.git
cd taylors-pantry

# install deps
npm install

# run in dev mode
npm run dev
# build for production
npm run build
# preview the production build
npm run preview
