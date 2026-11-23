# The Mentalist Wiki — CBI & FBI Case Archives

An interactive encyclopedia and investigative case archive for **The Mentalist (2008–2015)** built with **React**, **Vite**, **React Router**, and **Tailwind CSS**. All series metadata, 151 episode case files, 7 seasons, real-world actor biographies, in-universe character dossiers, and official artwork are dynamically retrieved from public REST APIs.

---

## Live Public API Data Sources

1. **TVmaze Public REST API (`https://api.tvmaze.com/shows/116`)**
   - `/shows/116` — Series overview, rating, genres, network, and schedule
   - `/shows/116/cast` — Starring cast pairing real-world actor records (`person`) with in-series characters (`character`)
   - `/shows/116/episodes` — All 151 episodes across 7 seasons with airdate, rating, image, and synopsis
   - `/episodes/:id?embed[]=guestcast&embed[]=guestcrew` — Individual episode dossiers with guest actors, directors, and writers
   - `/shows/116/seasons`, `/shows/116/crew`, `/shows/116/images` — Seasons, production crew, and official posters/artwork
2. **The Mentalist Fandom MediaWiki API (`https://thementalist.fandom.com/api.php`)**
   - Dynamically fetches in-universe character infoboxes, quotes, extended episode story recaps, and Patrick Jane's 7 final Red John suspect dossiers.
3. **Wikipedia REST API (`https://en.wikipedia.org/api/rest_v1/page/summary/{title}`)**
   - Retrieves real-world actor career biographies and encyclopedic summaries.

---

## Key Features & Architecture

- **3D Fanned Stacked Card Deck & Dual-Identity Inspector (`/`)**:
  - Left-side 3D fanned card stack on the Home Page that cycles the front card to the back on an automated timer (with a live progress bar, keyboard navigation support, pause-on-hover, and manual controls).
  - Synchronized right-side Dual-Identity spotlight comparing the **Series Character Identity** with the **Real Actor Identity**.
- **Interactive Season & Episode Live Summarizer (`/`)**:
  - Pick any Season (1–7) or Episode (1–151) to fetch and summarize its plot, extended story recap, rating, and guest cast on the fly.
- **Two-Act Chronological Story Timeline (`/timeline`)**:
  - **Act I (`S01E01 "Pilot"` → `S06E08 "Red John"`)**: Traces Patrick Jane's CBI cases and the hunt for Red John.
  - **Act II (`S06E09 "My Blue Heaven"` → `S07E13 "White Orchids"`)**: Traces the post-Red John transition to the FBI.
- **Episode Case Directory (`/episodes` & `/episodes/:id`)**:
  - Relevance-ranked search by title, plot keyword, or episode code (searching `"Red John"` ranks `S06E08 "Red John"` #1); filter by Season, Story Act, or Title Color Motif (*Crimson/Red Titles* vs. *Post-Red John Color Shift*); launch a **1-Click Random Case File**; and browse with aligned pagination.
- **Actors & Series Characters Directory (`/characters` & `/characters/:id`)**:
  - Browse main cast and episode guest stars with split or centered single Character/Actor portraits and full dual biographies.
- **Seasons, Interactive Rating Trend Charts & Official Artwork Lightbox (`/seasons`)**:
  - Visual bar charts plotting episode ratings across each season, full-screen official poster/artwork lightbox gallery, and production crew directory.
- **Interactive Red John Suspect Board & Mentalist Observation Test (`/investigation`)**:
  - **7 Final Red John Suspects Board**: Mark suspects as *Cleared* or *Prime*, or test an accusation against live API dossiers.
  - **Mentalist Observation Test**: Dynamically generated deduction questions built on the fly from live TVmaze API payloads.
- **3-Layer Rate-Limit & Cache Protection (`src/services/api.js`)**:
  - Combines an in-memory `Map`, persistent `localStorage` cache (24-hour TTL), session cookie tracking (`mentalist_api_guard`), concurrent request deduplication, and `HTTP 429` exponential backoff with stale-cache fallback.
- **Hidden Red John Calling Card Easter Egg (`src/components/common/RedJohnEasterEgg.jsx`)**:
  - While single-clicking the top-left brand logo always navigates Home (`/`), you can summon Red John's Calling Card by:
    1. Typing **`tyger`** or **`tyger, tyger`** into **any search input** across the application (`Ctrl+K` Spotlight Search, Episodes Search, Timeline Search, or Actors Search).
    2. Clicking the **Red John Smiley icon in the Footer** (or **double-clicking** the top-left Red John Smiley emblem).

---

## Automated Testing & Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Run the automated Vitest test suite ( located in tests/ )
npm test

# 3. Start Vite development server (http://localhost:5173)
npm run dev

# 4. Build production bundle (outputs to dist/)
npm run build
```
