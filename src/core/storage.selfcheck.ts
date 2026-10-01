import assert from "node:assert/strict";

const local: Record<string, unknown> = {};
const sync: Record<string, unknown> = {};
const failures = { localRemove: false, syncSet: false };
Object.assign(globalThis, {
  chrome: {
    storage: {
      local: {
        get: async () => ({ ...local }),
        remove: async (keys: string[]) => {
          if (failures.localRemove) throw new Error("local remove failed");
          for (const key of keys) delete local[key];
        },
      },
      sync: {
        set: async (items: Record<string, unknown>) => {
          if (failures.syncSet) throw new Error("sync set failed");
          Object.assign(sync, items);
        },
      },
    },
  },
});

const { clearLyricCache, clearTranslationStorageCache, getTranslationCacheInfo, getUpdatedCacheInfo, refreshCacheInfo } = await import("@core/storage");

const entry = { type: "transient", value: "x", expiry: 0 };
const seed = (items: Record<string, unknown>): void => {
  for (const key of Object.keys(local)) delete local[key];
  Object.assign(local, items);
};

// -- Happy paths --------------------------
{
  seed({
    "blyrics_abcdefghijk_bLyrics-richsynced": entry,
    "blyrics_abcdefghijk_lrclib-synced": entry,
    "blyrics_zyxwvutsrqp_yt-lyrics": entry,
    blyrics_featured_themes: { themes: [] },
    blyrics_stableReleaseCheck: { checkedAt: 1 },
    userIdentity: { keyId: "k" },
  });
  const info = await getUpdatedCacheInfo();
  assert.equal(info.count, 2, "counts unique songs across lyric cache keys");
  assert.equal(info.size, JSON.stringify(entry).length * 3, "size covers only lyric cache keys");

  await clearLyricCache();
  assert.deepEqual(
    Object.keys(local).sort(),
    ["blyrics_featured_themes", "blyrics_stableReleaseCheck", "userIdentity"],
    "clearing lyrics keeps featured themes, the release check and identity"
  );
  assert.deepEqual(sync.cacheInfo, { count: 0, size: 0 }, "the stored stat is refreshed after clearing");
}

// -- Edge cases --------------------------
{
  seed({ blyrics_featured_themes: { themes: [] }, blyrics_stableReleaseCheck: { checkedAt: 1 } });
  assert.deepEqual(
    await getUpdatedCacheInfo(),
    { count: 0, size: 0 },
    "only non-lyric caches: the stat reads as empty, matching nothing to clear"
  );

  seed({ blyrics_abcdefghijk_metadata: entry });
  const metaOnly = await getUpdatedCacheInfo();
  assert.equal(metaOnly.count, 1, "cached song metadata counts as a cached song");
  await clearLyricCache();
  assert.deepEqual(Object.keys(local), [], "cached song metadata is cleared with the lyrics");

  seed({ "blyrics__yt-lyrics": entry, "blyrics_yt-lyrics": entry });
  assert.deepEqual(await getUpdatedCacheInfo(), { count: 0, size: 0 }, "keys without a video id are not lyric caches");

  seed({ "other_abcdefghijk_yt-lyrics": entry });
  assert.deepEqual(await getUpdatedCacheInfo(), { count: 0, size: 0 }, "keys without the cache prefix are ignored");
}

// -- Invariants --------------------------
{
  seed({ "blyrics_abcdefghijk_yt-lyrics": entry, blyrics_featured_themes: {} });
  await clearLyricCache();
  await clearLyricCache();
  assert.deepEqual(Object.keys(local), ["blyrics_featured_themes"], "clearing twice is idempotent");
}

// -- Error paths --------------------------
{
  seed({ "blyrics_abcdefghijk_yt-lyrics": entry, blyrics_featured_themes: {} });
  sync.cacheInfo = { count: 1, size: 99 };
  failures.syncSet = true;
  const cleared = await clearLyricCache();
  failures.syncSet = false;
  assert.deepEqual(
    Object.keys(local),
    ["blyrics_featured_themes"],
    "regression: a failed stat refresh still counts as cleared once the lyrics are removed"
  );
  assert.deepEqual(
    cleared,
    { count: 0, size: 0 },
    "regression: the clear returns the cleared stats even when saving them fails"
  );
  assert.deepEqual(
    sync.cacheInfo,
    { count: 1, size: 99 },
    "the stale saved copy is why callers render the returned stats"
  );

  seed({ "blyrics_abcdefghijk_yt-lyrics": entry });
  failures.syncSet = true;
  const current = await refreshCacheInfo();
  failures.syncSet = false;
  assert.deepEqual(
    current,
    { count: 1, size: JSON.stringify(entry).length },
    "a refresh returns the computed stats when saving them fails"
  );

  seed({ "blyrics_abcdefghijk_yt-lyrics": entry });
  failures.localRemove = true;
  await assert.rejects(clearLyricCache(), /local remove failed/, "a failed removal rejects");
  failures.localRemove = false;
}

// -- Translation cache -------------------
{
  seed({
    "gemini_lrclib_flash_video1_zh-TW_10": entry,
    "gemini_lrclib_flash_video2_ja_15": entry,
    "blyrics_abcdefghijk_yt-lyrics": entry,
    userIdentity: { keyId: "k" },
  });
  const tInfo = await getTranslationCacheInfo();
  assert.equal(tInfo.count, 2, "counts gemini translation cache keys");
  assert.equal(tInfo.size, JSON.stringify(entry).length * 2, "size covers only translation cache keys");

  await clearTranslationStorageCache();
  assert.deepEqual(
    Object.keys(local).sort(),
    ["blyrics_abcdefghijk_yt-lyrics", "userIdentity"],
    "clearing translation cache leaves lyric cache and identity untouched"
  );
  assert.deepEqual(await getTranslationCacheInfo(), { count: 0, size: 0 });
}

console.log("storage self-check passed");
