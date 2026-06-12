const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeRecords(records) {
  if (!records || typeof records !== "object" || Array.isArray(records)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(records).flatMap(([date, ids]) => {
      if (!DATE_KEY_PATTERN.test(date) || !Array.isArray(ids)) {
        return [];
      }

      const validIds = [...new Set(ids.filter((id) => typeof id === "string" && id))];
      return validIds.length ? [[date, validIds]] : [];
    }),
  );
}

export function toggleLearned(records, dateKey, wordId) {
  const next = normalizeRecords(records);
  const ids = new Set(next[dateKey] ?? []);

  if (ids.has(wordId)) {
    ids.delete(wordId);
  } else {
    ids.add(wordId);
  }

  if (ids.size) {
    next[dateKey] = [...ids];
  } else {
    delete next[dateKey];
  }

  return next;
}

export function getLearnedIdsForDate(records, dateKey) {
  return normalizeRecords(records)[dateKey] ?? [];
}

export function getSceneProgress(words, learnedIds, sceneId) {
  const sceneWords = words.filter((word) => word.scene === sceneId);
  const learned = new Set(learnedIds);

  return {
    learned: sceneWords.filter((word) => learned.has(word.id)).length,
    total: sceneWords.length,
  };
}
