/**
 * apiClient.js
 * A lightweight wrapper around fetch with session-based caching.
 */

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export const apiClient = {
  /**
   * Fetches data from the given URL with caching.
   * @param {string} url - The URL to fetch.
   * @param {object} options - Fetch options (method, headers, etc.).
   * @param {number} ttl - Time To Live in milliseconds.
   * @returns {Promise<any>} - The JSON response.
   */
  async getWithCache(url, options = {}, ttl = DEFAULT_TTL) {
    const cacheKey = `cbet_cache_${url}_${JSON.stringify(options.body || "")}`;
    const cachedData = sessionStorage.getItem(cacheKey);

    if (cachedData) {
      try {
        const { value, timestamp } = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > ttl;

        if (!isExpired) {
          console.log(`[Cache] Returning cached data for: ${url}`);
          return value;
        }
        console.log(`[Cache] Cache expired for: ${url}`);
      } catch (e) {
        console.warn("[Cache] Error parsing cached data", e);
      }
    }

    console.log(`[Cache] Fetching fresh data for: ${url}`);
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json();

    if (response.ok) {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          value: data,
          timestamp: Date.now(),
        })
      );
    }

    // Wrap the data in an object that mimics a response if needed, 
    // but usually, components expect the JSON body directly.
    return data;
  },

  /**
   * Invalidates a specific cache entry.
   * @param {string} url - The URL to invalidate.
   */
  invalidateCache(url) {
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (key.startsWith(`cbet_cache_${url}`)) {
        sessionStorage.removeItem(key);
      }
    });
  },

  /**
   * Clears all API caches.
   */
  clearAllCache() {
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (key.startsWith("cbet_cache_")) {
        sessionStorage.removeItem(key);
      }
    });
  },

  /**
   * Invalidates all caches matching a pattern.
   * Useful for clearing all "courses" data after an update.
   */
  invalidatePattern(pattern) {
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (key.includes(pattern)) {
        sessionStorage.removeItem(key);
      }
    });
  }
};
