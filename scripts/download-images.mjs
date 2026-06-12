import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

import { scenes, words } from "../js/data.js";

const API_URL = "https://api.openverse.org/v1/images/";
const USER_AGENT = "EverydayEnglishLearningSite/1.0 (educational project)";
const sceneOverrides = {
  kitchen: "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1400&q=82",
  "living-room": "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=82",
  bedroom: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1400&q=82",
  bathroom: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1400&q=82",
  office: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=82",
  neighborhood: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=82",
};
const wordQueryOverrides = {
  "kitchen-microwave": "microwave oven appliance",
  "kitchen-cabinet": "kitchen cabinets",
  "kitchen-stool": "wooden stool furniture",
  "kitchen-freezer": "freezer appliance",
  "kitchen-stove": "kitchen stove appliance",
  "kitchen-oven": "kitchen oven appliance",
  "kitchen-sink": "kitchen sink",
  "kitchen-frying-pan": "frying pan cookware",
  "kitchen-pot": "cooking pot",
  "kitchen-spatula": "kitchen spatula utensil",
  "kitchen-bowl": "ceramic bowl kitchen",
  "living-room-television": "television set living room",
  "living-room-floor-lamp": "floor lamp furniture",
  "living-room-vase": "flower vase",
  "living-room-picture-frame": "photo picture frame",
  "living-room-houseplant": "potted houseplant",
  "bedroom-duvet": "duvet on bed",
  "bedroom-nightstand": "bedside nightstand",
  "bedroom-wardrobe": "bedroom wardrobe furniture",
  "bedroom-drawer": "wooden drawer furniture",
  "bedroom-hanger": "clothes hanger",
  "bedroom-laundry-basket": "clothes laundry basket",
  "bedroom-mirror": "bedroom wall mirror",
  "bedroom-slippers": "house slippers",
  "bedroom-closet": "bedroom closet",
  "bedroom-chair": "wooden chair furniture",
  "bedroom-clothes-rack": "clothes rack bedroom",
  "bathroom-sink": "bathroom sink",
  "bathroom-bathtub": "bath tub bathroom",
  "bathroom-razor": "shaving razor",
  "bathroom-toilet-paper": "toilet paper roll",
  "bathroom-medicine-cabinet": "bathroom medicine cabinet",
  "bathroom-scale": "bathroom scale",
  "bathroom-tissue-box": "tissue box",
  "bathroom-shower-curtain": "bathroom shower curtain",
  "bathroom-bathrobe": "bath robe",
  "office-computer": "laptop computer",
  "office-mouse": "computer mouse",
  "office-printer": "office printer",
  "office-paper-clip": "paper clip metal",
  "office-folder": "office folder",
  "office-charger": "laptop charger",
  "neighborhood-sidewalk": "city sidewalk pavement",
  "neighborhood-traffic-light": "traffic light signal",
  "neighborhood-bench": "park bench",
  "neighborhood-fire-hydrant": "red fire hydrant",
  "neighborhood-parking-meter": "parking meter street",
  "neighborhood-fence": "wooden fence",
  "neighborhood-gate": "garden gate",
};
const qualityOverrideIds = new Set(Object.keys(wordQueryOverrides));
const preferredTitles = {
  "kitchen-pot": "The cook's smile, cooking vegetarian green bean soup, big wooden paddle spoon, young woman in a brown shirt, pot, kitchen, Breitenbush Hot Springs, Breitenbush, Oregon, USA",
  "kitchen-freezer": "we have a new freezer",
  "kitchen-spatula": "Spatulas - Auer Dult 2011",
  "living-room-television": "my new television set",
  "living-room-houseplant": "Three Plants",
  "bedroom-duvet": "Target Duvet in Bedroom",
  "bedroom-nightstand": "Nightstand",
  "bedroom-wardrobe": "Bedroom wardrobe storage from the Cassia Bi-Fold White range",
  "bedroom-hanger": "Clothes hangers",
  "bedroom-laundry-basket": "A child hiding in a laundry basket",
  "bedroom-mirror": "Bedroom Mirror",
  "bedroom-chair": "Wooden Chair",
  "bedroom-clothes-rack": "Clothing Rack",
  "bathroom-sink": "Bathroom Sink",
  "bathroom-razor": "Shaving razor - 34/365",
  "bathroom-tissue-box": "Giant Tissue Box",
  "bathroom-shower-curtain": "Bathroom - Shower Curtain",
  "bathroom-bathrobe": "Bath Robe",
  "office-charger": "BriteOn AC Laptop Power Adapter",
};
const preferredTitleIds = new Set(Object.keys(preferredTitles));
const jobs = [
  ...scenes.map((scene) => ({
    id: `scene-${scene.id}`,
    query: scene.query,
    overrideUrl: sceneOverrides[scene.id],
    providerVersion: "unsplash-scenes-v1",
    output: scene.image,
    width: 1100,
    height: 720,
  })),
  ...words.map((word) => ({
    id: word.id,
    query: wordQueryOverrides[word.id] ?? word.english,
    preferredTitle: preferredTitles[word.id],
    providerVersion: preferredTitleIds.has(word.id)
      ? "openverse-flickr-v4"
      : qualityOverrideIds.has(word.id)
        ? "openverse-flickr-v3"
        : "openverse-flickr-v2",
    output: word.image,
    width: 720,
    height: 540,
  })),
];

const attributionPath = "assets/images/ATTRIBUTION.json";
const attribution = await loadAttribution();

async function loadAttribution() {
  try {
    const existing = JSON.parse(await readFile(attributionPath, "utf8"));
    return Array.isArray(existing) ? existing : [];
  } catch {
    return [];
  }
}

async function saveAttribution() {
  attribution.sort((a, b) => a.file.localeCompare(b.file));
  await mkdir("assets/images", { recursive: true });
  await writeFile(attributionPath, `${JSON.stringify(attribution, null, 2)}\n`, "utf8");
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function request(url, attempts = 6) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (response.ok) return response;
      if (attempt === attempts) {
        throw new Error(`Request failed (${response.status}): ${url}`);
      }
      const retryAfter = Number(response.headers.get("retry-after"));
      await sleep(Number.isFinite(retryAfter) ? retryAfter * 1000 : attempt * 3000);
    } catch (error) {
      if (attempt === attempts) throw error;
      await sleep(attempt * 3000);
    }
  }
  throw new Error("Unreachable");
}

function scoreResult(result, query, preferredTitle) {
  const words = query.toLowerCase().split(/\s+/).filter((word) => word.length > 2);
  const title = (result.title ?? "").trim().toLowerCase();
  const haystack = [
    result.title,
    ...(result.tags ?? []).map((tag) => tag.name),
  ]
    .join(" ")
    .toLowerCase();
  const wordScore = words.reduce(
    (score, word) => score + (haystack.includes(word) ? 2 : 0),
    0,
  );
  const exactScore = title === query.toLowerCase() ? 20 : 0;
  const preferredScore = preferredTitle && title === preferredTitle.toLowerCase() ? 100 : 0;
  const titleScore = words.every((word) => title.includes(word)) ? 8 : 0;
  return preferredScore + exactScore + titleScore + wordScore;
}

async function findOpenverseImages(query, preferredTitle) {
  const params = new URLSearchParams({
    q: query,
    page_size: "20",
    mature: "false",
    source: "flickr",
  });
  const response = await request(`${API_URL}?${params}`);
  const payload = await response.json();
  const candidates = (payload.results ?? [])
    .filter((result) => result.thumbnail && result.width >= 400 && result.height >= 300)
    .sort(
      (a, b) =>
        scoreResult(b, query, preferredTitle) - scoreResult(a, query, preferredTitle),
    );

  if (!candidates.length) {
    throw new Error(`No Openverse image found for "${query}"`);
  }

  return candidates.slice(0, 10).map((image) => ({
    title: image.title,
    sourcePage: image.foreign_landing_url,
    imageUrls: [image.url, image.thumbnail].filter(Boolean),
    artist: image.creator ?? "",
    license: `${image.license?.toUpperCase() ?? ""} ${image.license_version ?? ""}`.trim(),
    licenseUrl: image.license_url ?? "",
    attribution: image.attribution ?? "",
  }));
}

async function downloadJob(job) {
  const existingEntry = attribution.find((item) => item.file === job.output);
  const existingAttribution =
    existingEntry?.providerVersion?.startsWith("openai-generated") ||
    existingEntry?.providerVersion === job.providerVersion;
  try {
    await access(job.output);
    if (existingAttribution) {
      console.log(`Skipped ${job.output}`);
      return;
    }
  } catch {
    // Continue when the image has not been downloaded yet.
  }

  const candidates = job.overrideUrl
    ? [{
        title: `${job.id} scene photo`,
        sourcePage: job.overrideUrl,
        imageUrls: [job.overrideUrl],
        artist: "Unsplash contributor",
        license: "Unsplash License",
        licenseUrl: "https://unsplash.com/license",
        attribution: "Photo provided by Unsplash",
      }]
    : await findOpenverseImages(job.query, job.preferredTitle);
  let image;
  let input;
  let lastError;

  for (const candidate of candidates) {
    for (const imageUrl of candidate.imageUrls) {
      try {
        const response = await request(imageUrl, 2);
        input = Buffer.from(await response.arrayBuffer());
        await sharp(input).metadata();
        image = candidate;
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (image) break;
  }

  if (!image || !input) {
    throw lastError ?? new Error(`No downloadable image found for "${job.query}"`);
  }
  const outputPath = path.resolve(job.output);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await sharp(input)
    .rotate()
    .resize(job.width, job.height, { fit: "cover", position: "attention" })
    .webp({ quality: 76, effort: 4 })
    .toFile(outputPath);

  const entry = {
    id: job.id,
    file: job.output,
    title: image.title,
    source: image.sourcePage,
    artist: image.artist,
    license: image.license,
    licenseUrl: image.licenseUrl,
    attribution: image.attribution,
    providerVersion: job.providerVersion,
  };
  const existingIndex = attribution.findIndex((item) => item.file === job.output);
  if (existingIndex >= 0) attribution[existingIndex] = entry;
  else attribution.push(entry);
  await saveAttribution();
  console.log(`Saved ${job.output}`);
  await sleep(650);
}

async function runPool(items, concurrency) {
  let nextIndex = 0;
  const failures = [];
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        await downloadJob(items[index]);
      } catch (error) {
        failures.push({ id: items[index].id, error: error.message });
        console.error(`Failed ${items[index].id}: ${error.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return failures;
}

const failures = await runPool(jobs, 2);
await saveAttribution();
if (failures.length) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
} else {
  console.log(`Downloaded ${jobs.length} local images.`);
}
