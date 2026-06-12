import test from "node:test";
import assert from "node:assert/strict";

import { scenes, words } from "../js/data.js";

test("the dataset contains six scenes with twenty words each", () => {
  assert.equal(scenes.length, 6);
  assert.equal(words.length, 120);

  for (const scene of scenes) {
    assert.equal(
      words.filter((word) => word.scene === scene.id).length,
      20,
      `${scene.id} should contain 20 words`,
    );
  }
});

test("scene and word IDs are unique", () => {
  assert.equal(new Set(scenes.map((scene) => scene.id)).size, scenes.length);
  assert.equal(new Set(words.map((word) => word.id)).size, words.length);
});

test("every scene uses a local WebP image", () => {
  for (const scene of scenes) {
    assert.match(scene.image, /^assets\/images\/scenes\/[a-z-]+\.webp$/);
  }
});

test("every word has complete learning content and a local WebP image", () => {
  const sceneIds = new Set(scenes.map((scene) => scene.id));

  for (const word of words) {
    assert.ok(sceneIds.has(word.scene), `${word.id} has an unknown scene`);
    for (const field of ["english", "chinese", "phonetic", "phrase", "example"]) {
      assert.ok(word[field]?.trim(), `${word.id} is missing ${field}`);
    }
    assert.match(
      word.image,
      new RegExp(`^assets/images/words/${word.scene}/[a-z0-9-]+\\.webp$`),
    );
  }
});
