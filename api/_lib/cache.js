/**
 * Simple in-memory cache with TTL (time-to-live).
 * Best-effort in serverless (resets on cold start).
 */

class Cache {
    constructor() {
        this.store = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    }

    get(key) {
        const entry = this.store.get(key);
        if (!entry) return null;

        if (Date.now() > entry.expires) {
            this.store.delete(key);
            return null;
        }

        return entry.value;
    }

    set(key, value, ttl) {
        // Evict old entries if cache is too large
        if (this.store.size > 200) {
            const now = Date.now();
            for (const [k, v] of this.store) {
                if (now > v.expires) this.store.delete(k);
            }
            // If still too large, clear oldest half
            if (this.store.size > 200) {
                const keys = [...this.store.keys()];
                keys.slice(0, Math.floor(keys.length / 2)).forEach((k) => this.store.delete(k));
            }
        }

        this.store.set(key, {
            value,
            expires: Date.now() + (ttl || this.defaultTTL),
        });
    }

    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Generate a cache key for nearby search params.
     * Rounds coordinates to ~100m precision.
     */
    searchKey(lat, lng, radius) {
        const rLat = Math.round(lat * 1000) / 1000;
        const rLng = Math.round(lng * 1000) / 1000;
        const rRadius = Math.round(radius / 100) * 100;
        return `nearby:${rLat}:${rLng}:${rRadius}`;
    }
}

// Singleton — survives across warm invocations in serverless
const cache = new Cache();

module.exports = cache;
