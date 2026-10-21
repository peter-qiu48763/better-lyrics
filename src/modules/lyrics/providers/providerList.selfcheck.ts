import { strict as assert } from "node:assert";
import { mergePreferredProviders, resolveGeminiFallbackModels } from "./providerList";

const defaults = ["a", "b", "unison-wordsynced", "c"];

assert.deepEqual(
  mergePreferredProviders([], defaults),
  ["a", "b", "unison-wordsynced", "c"],
  "empty stored list yields all defaults in order"
);

assert.deepEqual(
  mergePreferredProviders(["a", "b", "c"], defaults),
  ["a", "b", "unison-wordsynced", "c"],
  "a missing key is inserted at its natural position, not appended"
);

assert.deepEqual(
  mergePreferredProviders(["c", "a", "b"], defaults),
  ["c", "a", "b", "unison-wordsynced"],
  "insertion follows the last present predecessor in a custom order"
);

assert.deepEqual(
  mergePreferredProviders(["a", "d_b", "c"], defaults),
  ["a", "d_b", "unison-wordsynced", "c"],
  "a disabled predecessor still anchors the insertion and stays disabled"
);

assert.deepEqual(
  mergePreferredProviders(["b", "c"], defaults),
  ["a", "b", "unison-wordsynced", "c"],
  "a missing leading key inserts before its successor rather than at the end"
);

assert.deepEqual(
  mergePreferredProviders(["a", "b", "unison-wordsynced", "c"], defaults),
  ["a", "b", "unison-wordsynced", "c"],
  "a complete list is returned unchanged"
);

assert.deepEqual(
  mergePreferredProviders(["a", "x", "b", "c"], defaults),
  ["a", "x", "b", "unison-wordsynced", "c"],
  "unknown stored keys are preserved and do not disturb insertion"
);

assert.deepEqual(
  resolveGeminiFallbackModels(["gemini-old-model", "gemini-3.1-flash-lite"]),
  ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.6-flash"],
  "obsolete Gemini models are pruned while missing defaults are appended"
);

assert.deepEqual(
  resolveGeminiFallbackModels(["d_gemini-3.5-flash-lite", "gemini-3.6-flash"]),
  ["gemini-3.1-flash-lite", "d_gemini-3.5-flash-lite", "gemini-3.6-flash"],
  "disabled states and custom ordering are preserved while missing defaults are added"
);

console.log("providerList selfcheck passed");
