# Everyday English Objects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a responsive static website for learning 120 everyday English object words across six scenes, with local images, pronunciation, phrases, examples, and per-day learned-card tracking.

**Architecture:** Use a small ES module application with vocabulary data isolated from rendering and storage logic. The page is a static HTML shell; JavaScript renders scene and word views, while pure helper functions provide testable date, filtering, and progress behavior. All image assets live under `assets/images` and are referenced by stable local paths.

**Tech Stack:** HTML5, CSS3, browser ES modules, Web Speech API, Local Storage, Node.js built-in test runner.

---

## File Structure

- `index.html`: semantic application shell and metadata.
- `styles.css`: responsive design system and component styles.
- `js/data.js`: six scene definitions and 120 vocabulary records.
- `js/learning.js`: pure date, record, filtering, and progress helpers.
- `js/app.js`: browser rendering, navigation, speech, and event handling.
- `tests/data.test.js`: vocabulary completeness and local-image-path tests.
- `tests/learning.test.js`: learned-record behavior tests.
- `assets/images/scenes/*.webp`: six local scene images.
- `assets/images/words/<scene>/*.webp`: local vocabulary images.
- `scripts/download-images.mjs`: reproducible Wikimedia thumbnail downloader and compressor.

### Task 1: Learning Record Domain

**Files:**
- Create: `tests/learning.test.js`
- Create: `js/learning.js`
- Create: `package.json`

- [ ] **Step 1: Write failing tests for local date keys, toggling, filtering, and progress**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  getLocalDateKey,
  toggleLearned,
  getLearnedIdsForDate,
  getSceneProgress
} from "../js/learning.js";

test("getLocalDateKey uses the supplied local calendar date", () => {
  assert.equal(getLocalDateKey(new Date(2026, 5, 12, 23, 30)), "2026-06-12");
});

test("toggleLearned adds and removes a card for one date", () => {
  const added = toggleLearned({}, "2026-06-12", "kitchen-microwave");
  assert.deepEqual(added, { "2026-06-12": ["kitchen-microwave"] });
  assert.deepEqual(toggleLearned(added, "2026-06-12", "kitchen-microwave"), {});
});

test("getLearnedIdsForDate ignores records from other dates", () => {
  const records = { "2026-06-11": ["a"], "2026-06-12": ["b", "c"] };
  assert.deepEqual(getLearnedIdsForDate(records, "2026-06-12"), ["b", "c"]);
});

test("getSceneProgress counts learned cards in the requested scene", () => {
  const words = [{ id: "a", scene: "kitchen" }, { id: "b", scene: "office" }];
  assert.deepEqual(getSceneProgress(words, ["a", "b"], "kitchen"), { learned: 1, total: 1 });
});
```

- [ ] **Step 2: Run tests and verify missing-module failure**

Run: `node --test tests/learning.test.js`

Expected: FAIL because `js/learning.js` does not exist.

- [ ] **Step 3: Implement the pure learning helpers**

Implement immutable helpers that normalize invalid records, remove empty date entries, deduplicate IDs, and return `{ learned, total }` for a scene.

- [ ] **Step 4: Run tests**

Run: `npm test`

Expected: all learning tests pass.

### Task 2: Vocabulary Dataset

**Files:**
- Create: `tests/data.test.js`
- Create: `js/data.js`

- [ ] **Step 1: Write failing dataset contract tests**

Test that there are exactly six scenes, exactly 20 words per scene, 120 unique IDs, non-empty English/Chinese/phonetic/phrase/example fields, and local `.webp` image paths.

- [ ] **Step 2: Run tests and verify missing exports**

Run: `node --test tests/data.test.js`

Expected: FAIL because `js/data.js` does not exist.

- [ ] **Step 3: Add scene and vocabulary records**

Create records for kitchen, living room, bedroom, bathroom, office, and neighborhood. Keep examples short and conversational, and use stable IDs such as `kitchen-microwave`.

- [ ] **Step 4: Run the complete test suite**

Run: `npm test`

Expected: 120-word data contract and learning behavior tests pass.

### Task 3: Static Application Interface

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `js/app.js`

- [ ] **Step 1: Create the semantic shell**

Add the site header, main application mount point, status region, and module script. Include viewport, description, and theme metadata.

- [ ] **Step 2: Implement the visual system**

Use a deep green and warm orange palette, responsive scene grids, four-column desktop word cards, two-column tablet layout, and single-column mobile layout. Provide visible focus states and reduced-motion support.

- [ ] **Step 3: Implement scene and today rendering**

Render the six scene cards, scene detail header, progress, word cards, empty state, and today's learned-card view from data. Use hash routes `#home`, `#scene/<id>`, and `#today`.

- [ ] **Step 4: Implement learning interactions**

Read and write records through Local Storage, update all visible counts immediately, allow learned-state cancellation, and recover safely from malformed stored JSON.

- [ ] **Step 5: Implement speech and image fallback**

Use `speechSynthesis` with an English voice for word and example playback. Replace failed images with a local styled fallback that preserves the English and Chinese labels.

### Task 4: Local Image Pipeline

**Files:**
- Create: `scripts/download-images.mjs`
- Create: `assets/images/scenes/*.webp`
- Create: `assets/images/words/<scene>/*.webp`

- [ ] **Step 1: Implement a reproducible downloader**

Use the Wikimedia Commons API to search for one suitable image per scene and word. Download thumbnails, resize to a maximum width of 720 pixels for word cards and 1100 pixels for scenes, and encode WebP at moderate quality.

- [ ] **Step 2: Run the downloader**

Run: `npm run images`

Expected: 126 WebP files are present under `assets/images`.

- [ ] **Step 3: Verify image inventory and dimensions**

Run a Node validation script that checks every path referenced by `js/data.js`, confirms non-zero file sizes, and ensures images are not oversized.

### Task 5: Browser Verification

**Files:**
- Modify as needed: `index.html`, `styles.css`, `js/app.js`

- [ ] **Step 1: Start a static server**

Run: `python -m http.server 4173`

- [ ] **Step 2: Verify the desktop flow**

Open `http://localhost:4173`, enter each scene, play pronunciation, mark and unmark cards, open today's view, reload, and confirm persistence.

- [ ] **Step 3: Verify responsive behavior**

Check a desktop viewport and a mobile viewport around 390 pixels wide. Confirm no horizontal overflow, readable text, usable buttons, and stable image crops.

- [ ] **Step 4: Run automated verification**

Run: `npm test`

Expected: all tests pass with zero failures.

- [ ] **Step 5: Update README and commit**

Document local use and image attribution/source approach, inspect `git diff --check`, commit the implementation, and push `main` to `origin`.
