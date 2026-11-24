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
4. **Wikiquote MediaWiki API (`https://en.wikiquote.org/w/api.php`)**
   - Dynamically pulls iconic series dialogue and banter scenes paired with unique episode stills.
5. **Community Memes APIs (`https://api.pullpush.io/reddit/search/submission/?subreddit=TheMentalist` & `https://meme-api.com/gimme/TheMentalist/20`)**
   - Streams a 65+ post live archive of top-scoring social-media fan posts, memes, and GIFs from `r/TheMentalist` with persistent `localStorage` caching and rate-limited manual refresh rotation.

---

## Key Features & Architecture

- **3D Fanned Stacked Card Deck & Dual-Identity Inspector (`/`)**:
  - Left-side 3D fanned card stack on the Home Page that cycles the front card to the back on an automated timer (with working Pause/Play toggle, automatic silent pause while reading expanded biographies, and keyboard navigation).
  - Synchronized right-side Dual-Identity spotlight comparing the **Series Character Identity** with the **Real Actor Identity**.
- **Community Memes, GIFs & Iconic Banter Showcase (`/`)**:
  - Balanced feed combining live `r/TheMentalist` memes (persisted in `localStorage`, full-viewport click-to-zoom lightbox, and a rate-limited **Refresh Memes** button with a 15-second cooldown and 3-refreshes-per-minute limit) alongside unique-episode Wikiquote banter cards.
- **Interactive Season & Episode Live Summarizer (`/`)**:
  - Pick any Season (1–7) or Episode (1–151) to fetch and summarize its plot, extended story recap, rating, and guest cast on the fly.
- **Two-Act Chronological Story Timeline (`/timeline`)**:
  - **Act I (`S01E01 "Pilot"` → `S06E08 "Red John"`)**: Traces Patrick Jane's CBI cases and the hunt for Red John.
  - **Act II (`S06E09 "My Blue Heaven"` → `S07E13 "White Orchids"`)**: Traces the post-Red John transition to the FBI.
- **Episode Case Directory (`/episodes` & `/episodes/:id`)**:
  - Relevance-ranked search by title, plot keyword, or episode code (searching `"Red John"` ranks `S06E08 "Red John"` #1); filter by Season, Story Act, Title Color Motif, **Watched**, or **Favorites**; launch a **1-Click Random Case File**; and browse with aligned pagination.
- **Actors, Series Characters & CBI/FBI Credential Badge Studio (`/characters` & `/characters/:id`)**:
  - Browse main cast and episode guest stars with split or centered single Character/Actor portraits and full dual biographies.
  - **Series-Authentic CBI & FBI Badge Creator**: Choose between the CBI 7-Point Gold Star (Seasons 1–6) and FBI Gold Eagle Shield (Seasons 6–7), upload your own photo from your device or pick a cast portrait, customize every field freely (Name, Agency, Acronym, Rank, Specialty, Field Office, Serial ID), and export a high-resolution PNG badge.
- **Seasons, Interactive Rating Trend Charts & Official Artwork Lightbox (`/seasons`)**:
  - Visual bar charts plotting episode ratings across each season, full-screen official poster/artwork lightbox gallery, and production crew directory.
- **Interactive Red John Suspect Board & Mentalist Observation Test (`/investigation`)**:
  - **7 Final Red John Suspects Board**: Inspect Patrick Jane's 7 final suspects and click **Accuse as Red John** to receive an instant pop-up Verdict Modal; wrong accusations are stamped with a bold **Red X** on the suspect's card.
  - **Mentalist Observation Test**: Dynamically generated, non-repeating deduction questions built on the fly from live episodes and cast data with session-cached score & streak tracking.
- **3-Layer Rate-Limit & Cache Protection (`src/services/api.js`)**:
  - Combines an in-memory `Map`, persistent `localStorage` cache (24-hour TTL), session cookie tracking (`mentalist_api_guard`), concurrent request deduplication, manual meme refresh throttling, and `HTTP 429` exponential backoff with stale-cache fallback.
- **Hidden Red John Easter Eggs**:
  - **Red John Calling Card (`src/components/common/RedJohnEasterEgg.jsx`)**: While single-clicking the top-left brand logo always navigates Home (`/`), you can summon Red John's Calling Card by:
    1. Typing **`tyger`** or **`tyger, tyger`** into **any search input** across the application (`Ctrl+K` Spotlight Search, Episodes Search, Timeline Search, or Actors Search).
    2. Clicking the **Red John Smiley icon in the Footer** (or **double-clicking** the top-left Red John Smiley emblem).
  - **Season 6, Episode 8 Favorite Flash (`src/components/common/RedJohnSmileyFlash.jsx`)**:
    - Marking **Season 6, Episode 8 ("Red John")** as a **Favorite** (from either the Episodes directory card or its Episode Detail page) silently summons a full-screen crimson Red John smiley pop-up that automatically closes after 5 seconds.

---

## Automated Testing & Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Run the automated Node test suite (located in tests/)
npm test

# 3. Start Vite development server (http://localhost:5173)
npm run dev

# 4. Build production bundle (outputs to dist/)
npm run build
```
