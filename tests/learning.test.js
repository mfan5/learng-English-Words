import test from "node:test";
import assert from "node:assert/strict";

import {
  getLearnedIdsForDate,
  getLocalDateKey,
  getSceneProgress,
  normalizeRecords,
  toggleLearned,
} from "../js/learning.js";

test("getLocalDateKey uses the supplied local calendar date", () => {
  assert.equal(getLocalDateKey(new Date(2026, 5, 12, 23, 30)), "2026-06-12");
});

test("normalizeRecords removes invalid dates, values, and duplicate IDs", () => {
  assert.deepEqual(
    normalizeRecords({
      "2026-06-12": ["kitchen-microwave", "kitchen-microwave", 42],
      nope: ["office-printer"],
      "2026-06-13": "not-an-array",
    }),
    { "2026-06-12": ["kitchen-microwave"] },
  );
});

test("toggleLearned adds and removes a card for one date", () => {
  const added = toggleLearned({}, "2026-06-12", "kitchen-microwave");
  assert.deepEqual(added, { "2026-06-12": ["kitchen-microwave"] });
  assert.deepEqual(toggleLearned(added, "2026-06-12", "kitchen-microwave"), {});
});

test("toggleLearned keeps other dates unchanged", () => {
  const records = { "2026-06-11": ["office-printer"] };
  assert.deepEqual(toggleLearned(records, "2026-06-12", "kitchen-microwave"), {
    "2026-06-11": ["office-printer"],
    "2026-06-12": ["kitchen-microwave"],
  });
});

test("getLearnedIdsForDate ignores records from other dates", () => {
  const records = { "2026-06-11": ["a"], "2026-06-12": ["b", "c"] };
  assert.deepEqual(getLearnedIdsForDate(records, "2026-06-12"), ["b", "c"]);
});

test("getSceneProgress counts learned cards in the requested scene", () => {
  const words = [
    { id: "a", scene: "kitchen" },
    { id: "b", scene: "office" },
    { id: "c", scene: "kitchen" },
  ];
  assert.deepEqual(getSceneProgress(words, ["a", "b"], "kitchen"), {
    learned: 1,
    total: 2,
  });
});
