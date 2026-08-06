/**
 * Deep-merging plain JSON objects.
 *
 * One consumer: seeding `~/.config/statusline.json`. That file is ours to
 * supply defaults for and the user's to edit, so a re-install has to add the
 * settings a new version introduced without reverting the ones they changed —
 * which is a merge, not a write.
 *
 * The prototype keys are dropped rather than merged. `__proto__` arriving from
 * a config file is not a key anyone meant to set, and assigning it walks up the
 * prototype chain instead of into the object.
 */

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * `override` wins, recursing into objects and replacing everything else.
 *
 * Arrays replace wholesale: a palette or a segment list is one setting, and
 * element-wise merging would splice our defaults back into a list the user
 * deliberately shortened.
 */
export function deepMerge(base: unknown, override: unknown): unknown {
  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override === undefined ? base : override;
  }
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    if (UNSAFE_KEYS.has(key)) {
      continue;
    }
    out[key] = isPlainObject(base[key]) && isPlainObject(override[key])
      ? deepMerge(base[key], override[key])
      : override[key];
  }
  return out;
}
