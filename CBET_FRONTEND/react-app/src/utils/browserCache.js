const DASHBOARD_CACHE_PREFIX = "cbet-dashboard-cache::";
const LEGACY_CACHE_PREFIXES = ["cbet-cache::"];

export const DEFAULT_DASHBOARD_CACHE_TTL_MS = 10 * 60 * 1000;

export const getDashboardCacheKey = (...parts) =>
  `${DASHBOARD_CACHE_PREFIX}${parts.join("::")}`;

export const readDashboardCache = (key) => {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue?.expiresAt || Date.now() > Number(parsedValue.expiresAt)) {
      localStorage.removeItem(key);
      return null;
    }

    return parsedValue.data ?? null;
  } catch {
    return null;
  }
};

export const writeDashboardCache = (
  key,
  data,
  ttlMs = DEFAULT_DASHBOARD_CACHE_TTL_MS,
) => {
  try {
    localStorage.setItem(
      key,
      JSON.stringify({
        data,
        expiresAt: Date.now() + ttlMs,
      }),
    );
  } catch {
    // Ignore storage quota failures and fall back to network requests.
  }
};

export const removeDashboardCache = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore browser storage access errors.
  }
};

export const clearDashboardCaches = () => {
  try {
    const keysToRemove = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (
        key &&
        (key.startsWith(DASHBOARD_CACHE_PREFIX) ||
          LEGACY_CACHE_PREFIXES.some((prefix) => key.startsWith(prefix)))
      ) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore browser storage access errors.
  }
};
