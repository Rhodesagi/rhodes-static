# RhodesCards System Guide

> Complete Anki-class SRS flashcard system. URL: `rhodesagi.com/cards/`
> All features implemented across Phases 0-6 (Sessions S127-S128).

---

## Architecture

### Frontend — Vanilla JS SPA (`/var/www/html/cards/`)
```
index.html              — HTML shell with 8 views + 7 modals
cards.css               — All styles (~1,100 lines, dark/light themes)
cards-sw.js             — Service worker for offline support
js/
├── utils.js            — esc(), toast(), debounce(), formatDue()
├── api.js              — getToken(), api(), apiUpload()
├── templates.js        — renderCardContent() (Markdown + sanitize + cloze + media + KaTeX)
├── decks.js            — Deck list/detail, subdecks, options, export, custom study
├── review.js           — Review session with undo, TTS, voice, speed focus
├── browse.js           — Card browser + editor + tag bar + search suggestions
├── add.js              — Add card form with frozen fields
├── import.js           — File upload + language import
├── stats.js            — Stats + heatmap
├── media.js            — Media upload + paste handler
├── search.js           — Search suggestions UI
├── occlusion.js        — Image occlusion canvas editor
├── tts.js              — Text-to-speech (ElevenLabs + Web Speech API fallback)
├── voice.js            — Voice recognition (Web Speech API)
├── timer.js            — Speed Focus mode + Pomodoro timer
├── tags.js             — Hierarchical tag tree, color-coding, pinning
├── cardstats.js        — Per-card stats, true retention, cloze overlapper, frozen fields
└── app.js              — Routing, keyboard shortcuts, theme toggle, init
lib/
├── marked.min.js       — Markdown parser
├── purify.min.js       — DOMPurify sanitizer
├── katex.min.js        — KaTeX math renderer
├── katex.min.css       — KaTeX styles (font paths fixed to /cards/lib/fonts/)
├── auto-render.min.js  — KaTeX auto-render
└── fonts/              — KaTeX woff2 font files
```

**Key rule**: All functions use `RC.` global namespace (no ES modules, avoids CORS). Classic script tags with `?v=N` cache-busting.

### Backend — aiohttp REST API (`/opt/rhodes-ai/server/`)
```
cards_api.py        (~150 lines)  — Router + 3-tier auth (verify_user_token → DB → APIKeyManager)
cards_decks.py      (~180 lines)  — Deck CRUD + subdeck support (:: naming, parent chain, recursive CTE)
cards_notes.py      (~220 lines)  — Note/Card CRUD + multi-card generation (cloze N, reverse 2)
cards_review.py     (~400 lines)  — Review queue (includes child decks) + submit + undo + suspend/bury/flag
cards_browse.py     (~200 lines)  — Browse + advanced search parser (_parse_search_query)
cards_import.py     (~620 lines)  — Import (apkg/csv/json/txt) + Export (csv/json/apkg)
cards_stats.py      (~175 lines)  — Stats + heatmap + study-status (TotalControl integration)
cards_media.py      (~170 lines)  — Media upload/serve/delete (20MB max, image/audio/video)
cards_filtered.py   (~170 lines)  — Filtered/custom study decks (presets + custom search)
cards_fsrs.py       (~275 lines)  — FSRS-5 scheduler (19-parameter model, pure functions)
```

**All submodules import `_auth_required` from `cards_api.py`.**

### Database — PostgreSQL (`rhodes_db`, 7 tables)
```sql
rc_decks          — name, description, settings JSONB, parent_id, is_filtered, filter_config JSONB
rc_notes          — deck_id, user_id, card_type, fields JSONB, tags text[], source_id
rc_cards          — note_id, deck_id, card_ordinal, state/stability/difficulty/interval/due/reps/lapses,
                    suspended BOOLEAN, buried_until DATE, flag SMALLINT
rc_review_log     — card_id, user_id, rating, state_before/after, response_ms
rc_daily_stats    — user_id, stat_date, reviews_total/new, correct_count, time_ms
rc_media          — user_id, note_id, filename, stored_name, mime_type, size_bytes
rc_review_undo    — user_id, review_log_id, card_id, all _before state columns (last 10 per user)
```

**Indexes**: GIN on rc_notes.tags, partial on rc_cards.suspended, on rc_decks.parent_id

### Nginx (`/etc/nginx/conf.d/rhodes.conf`)
```nginx
location /cards/ { alias /var/www/html/cards/; index index.html; try_files ... }
location /cards-media/ { alias /mnt/HC_Volume_104562347/rhodes-cards-media/; expires 30d; }
```

### Media Storage
Files stored at `/mnt/HC_Volume_104562347/rhodes-cards-media/<user_id>/<uuid>.<ext>`

---

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/cards/decks | List decks with aggregated child counts |
| POST | /api/cards/decks | Create deck (supports :: subdeck syntax) |
| PUT | /api/cards/decks/{id} | Update deck name/description/settings |
| DELETE | /api/cards/decks/{id} | Delete deck + cascade |
| POST | /api/cards/notes | Create note (auto-generates cards by type) |
| PUT | /api/cards/notes/{id} | Update note (reconciles cloze cards) |
| DELETE | /api/cards/notes/{id} | Delete note + cards |
| GET | /api/cards/decks/{id}/browse | Browse with advanced search parser |
| GET | /api/cards/tags | List tags with counts |
| GET | /api/cards/decks/{id}/review | Review queue (includes child decks) |
| POST | /api/cards/review | Submit rating (1-4) |
| POST | /api/cards/review/undo | Undo last review |
| POST | /api/cards/cards/{id}/suspend | Toggle suspend |
| POST | /api/cards/cards/{id}/bury | Bury until tomorrow |
| POST | /api/cards/cards/{id}/flag | Set flag 0-7 |
| GET | /api/cards/stats | Global stats |
| GET | /api/cards/decks/{id}/stats | Per-deck stats |
| POST | /api/cards/import/file | Upload .apkg/.csv/.tsv/.txt/.json |
| POST | /api/cards/import/lang | Import Rhodes language course |
| GET | /api/cards/import/languages | List available courses |
| GET | /api/cards/decks/{id}/export | Export as CSV/JSON/APKG |
| GET | /api/cards/study-status | Active study time estimates |
| POST | /api/cards/media/upload | Upload media file |
| DELETE | /api/cards/media/{id} | Delete media file |
| POST | /api/cards/decks/filtered | Create filtered study deck |
| GET | /api/cards/filtered/{id}/review | Review filtered deck |
| DELETE | /api/cards/decks/filtered/{id} | Delete filtered deck |

---

## Feature Matrix

### Card Types
| Type | Cards/Note | Behavior |
|------|-----------|----------|
| `basic` | 1 | Front → Back |
| `reverse` | 2 | Front → Back + Back → Front |
| `type_answer` | 1 | User types answer, exact match comparison |
| `cloze` | N | One card per `{{cN::answer::hint}}` deletion |

### FSRS-5 Scheduler
- 19-parameter model with sensible defaults (open-source)
- States: New(0) → Learning(1) → Review(2), Relearning(3) on lapse
- Learning steps: [1, 10] min. Relearning: [10] min. Default retention: 0.9
- Per-deck configurable: new/review limits, retention, learning steps, max interval

### Content Rendering
- **Markdown**: marked.js with DOMPurify sanitization
- **Math**: KaTeX with `$...$` inline and `$$...$$` display
- **Media**: `[sound:file.mp3]` → `<audio>`, `[video:file.mp4]` → `<video>`
- **Images**: Markdown `![](url)` syntax, paste from clipboard

### Search Syntax
```
tag:vocab           -tag:excluded      deck:Name
is:due              is:new             is:learn
is:review           is:suspended       is:buried
flag:1              prop:ivl>30        prop:reps>5
prop:lapses>3       rated:7            type:cloze
"exact phrase"      free text search
```

### Features List
- Subdecks (:: naming, recursive aggregation)
- Filtered/custom study (Review Ahead, Forgot Today, Random, custom search)
- Image occlusion (canvas editor, touch support)
- Text-to-speech (ElevenLabs + Web Speech API fallback)
- Voice recognition (Web Speech API, auto-reveal on type-answer cards)
- Speed Focus mode (auto-reveal timer, auto-advance with configurable rating)
- Pomodoro timer (25/5 cycle, long break every 4 sessions)
- Cloze Overlapper (sequential list → overlapping cloze cards)
- Frozen Fields (persist field values across card additions)
- Hierarchical tag tree (color-coding, pinning, collapsible)
- Keyboard shortcut customization (localStorage, modal key capture)
- Light/dark theme toggle
- Offline support (service worker, API caching)
- Review undo (last 10 per user)
- Suspend/bury/flag cards (flags 0-7 color-coded)
- APKG import/export (valid Anki 2.1 SQLite format)
- CSV/JSON/TXT import with auto-detection
- Language course import (Rhodes language courses)
- Review heatmap (90 days)
- Session summary stats

---

## Key Rules

1. **ALWAYS MODULARIZE** — Every new feature gets its own JS file. Never add to existing files unless extending existing functionality.
2. **RC. namespace** — All functions must be on the `RC` global object. No ES modules.
3. **Cache-bust** — Increment `?v=N` on all script/CSS tags after changes.
4. **Frontend NOT in git** — `/var/www/html/cards/` is outside `/opt/rhodes-ai/`. Deploy directly via SCP.
5. **Backend IS in git** — `/opt/rhodes-ai/server/cards_*.py` files. Always git commit + push.
6. **Media on volume** — Never store media on root disk. Use `/mnt/HC_Volume_104562347/rhodes-cards-media/`.
7. **Auth via _auth_required** — All endpoints use the decorator from `cards_api.py`.
8. **FSRS is pure** — `cards_fsrs.py` has no DB access. All scheduling is pure functions.
9. **Settings in JSONB** — Deck settings, filter configs stored in JSONB columns.
10. **Test visually** — After any change, `vps_browse` to verify the UI loads.

---

## Development Workflow

```bash
# 1. Write files locally to /tmp/
# 2. SCP to VPS
scp -i ~/.ssh/hetzner_rescue /tmp/file.py root@178.156.139.252:/opt/rhodes-ai/server/file.py
scp -i ~/.ssh/hetzner_rescue /tmp/file.js root@178.156.139.252:/var/www/html/cards/js/file.js

# 3. Restart server (backend changes only)
ssh root@178.156.139.252 "systemctl restart rhodes-server"

# 4. Git commit backend
ssh root@178.156.139.252 "cd /opt/rhodes-ai && git add -A && git commit -m 'description' && git push origin main"

# 5. Verify
vps_browse https://rhodesagi.com/cards/
```


---

## Planned Features (Tier 1-3, for parallel instance builds)

### Tier 1 — Quick wins (each a single JS file, ~10-30 min)

**1. ETA / Remaining Time** (`js/eta.js`)
- Show "~12 min remaining" in review header
- Rolling average of time-per-card from session stats
- Update dynamically after each card
- Wire into `review.js` showCurrentCard()

**2. Edit Field During Review** (`js/inline-edit.js`)
- Click front/back text during review → contenteditable
- Save on blur via `PUT /api/cards/notes/{id}`
- Need note_id available in review queue (already returned via cards join)
- Visual indicator: pencil icon on hover

**3. Card Info During Review** (`js/card-info.js`)
- "i" button in review card corner
- Shows popup/sidebar: interval, stability, difficulty, reps, lapses, created, last review, deck
- Data already available in review queue response, just needs UI

**4. Answer Confirmation Flash** (add to `review.js`)
- After submitRating(), flash card border:
  - Again → red, Hard → orange, Good → green, Easy → cyan
- CSS animation: `0.3s border-color pulse`
- One-liner in submitRating()

**5. Full Screen Mode** (`js/fullscreen.js`)
- F11 or button → `document.documentElement.requestFullscreen()`
- Hide header, show only review card + rating buttons
- Escape exits fullscreen
- Button in review header

**6. Collapsible Fields** (add to `templates.js`)
- In renderCardContent(), parse `[hint]text[/hint]` → `<details><summary>Hint</summary>text</details>`
- Also support `[extra]text[/extra]` for additional info
- CSS styling for details/summary to match theme

**7. Exam Countdown** (`js/countdown.js`)
- localStorage: `rc_exam_date` and `rc_exam_name`
- Show "47 days until MCAT" on deck list view
- Settings: click to set/clear exam date
- Optional: show in review header too

### Tier 2 — Medium effort

**8. Batch Editing** (backend: `cards_batch.py`, frontend: add to `browse.js`)
- Backend: `POST /api/cards/batch` with body `{ card_ids: [...], action: "set_tag"|"remove_tag"|"set_field"|"suspend"|"flag", value: ... }`
- Frontend: checkbox column in browse table, "Select All" button, action dropdown
- Actions: add/remove tag, set flag, suspend/unsuspend, move to deck, delete

**9. Workload Simulator** (`js/simulator.js`, backend: `cards_simulator.py`)
- Backend: `GET /api/cards/decks/{id}/simulate?new_per_day=20&days=30`
- Uses FSRS parameters to project: for each day, how many reviews expected
- Returns array of { date, projected_reviews, projected_new }
- Frontend: line chart (canvas or simple bar chart)

**10. Pop-up Dictionary** (`js/dictionary.js`)
- On double-click or text selection in review card, show popup
- Fetch from free API: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
- Show definition, pronunciation, part of speech
- For non-English: detect language from deck tags or card content

**11. Leaderboard / Achievements** (backend: new tables, frontend: `js/achievements.js`)
- DB tables: `rc_achievements` (user_id, achievement_id, earned_at), `rc_xp_log`
- Achievements: First Review, 7-Day Streak, 30-Day Streak, 100 Reviews, 1000 Reviews, Perfect Session, Speed Demon (avg <3s/card)
- XP: 1 per review, bonus for streaks
- Leaderboard: optional opt-in, show top users by XP/streak

**12. Rich Text Toolbar** (`js/editor-toolbar.js`)
- Toolbar above textarea in add/edit forms
- Buttons: Bold, Italic, Code, Highlight (colors), List, Heading, Link, Image
- Insert markdown syntax at cursor position
- Preview updates live

### Tier 3 — Differentiators

**13. Collaborative/Shared Decks**
- New tables: `rc_shared_decks`, `rc_deck_subscriptions`, `rc_deck_suggestions`
- Creator publishes deck → subscribers get updates
- Subscribers can suggest edits → creator approves/rejects
- Personal tags preserved across syncs

**14. Life Drain / HP Bar** (`js/lifedrain.js`)
- HP starts at 100, drains over time and on Again ratings
- Correct answers restore HP
- HP bar at top of review screen
- Configurable: drain rate, restore amount, "game over" behavior

**15. Puppy Reinforcement** (`js/reinforcement.js`)
- At configurable intervals (every 10-20 cards), show popup with random image + encouraging message
- Default images bundled, user can upload custom
- Messages: "Great job!", "Keep going!", "You're on fire!"

---

## Parallelization Guide

Each Tier 1 feature is fully independent — assign to separate Claude instances:

```
Instance A: ETA + Full Screen + Answer Flash (review.js touches)
Instance B: Edit Field During Review + Card Info (new files, review integration)
Instance C: Collapsible Fields + Exam Countdown (templates.js + new file)
Instance D: Batch Editing (backend + frontend)
Instance E: Pop-up Dictionary + Rich Text Toolbar (new files)
```

**Rules for parallel instances:**
1. Read `RHODESCARDS-GUIDE.md` first
2. Create NEW JS files for new features (one per feature)
3. When modifying existing files (review.js, templates.js), keep changes minimal
4. Increment cache-bust version: currently `?v=8`
5. Test with `vps_browse https://rhodesagi.com/cards/`
6. Backend changes: git commit + push after testing
7. Frontend changes: SCP directly to `/var/www/html/cards/`
