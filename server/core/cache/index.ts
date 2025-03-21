import logger from '../logger';

// Interface for cache items
interface CacheItem<T> {
  value: T;
  expiry: number | null; // Timestamp when the item expires, null for no expiration
  createdAt: number;
}

/**
 * In-memory cache service
 * 
 * Provides caching with key-based invalidation and time-based expiration
 */
class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private keyPrefixes: Map<string, Set<string>> = new Map();
  
  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttlMs Time to live in milliseconds (optional)
   * @param prefixes Associated prefixes for group invalidation (optional)
   */
  set<T>(key: string, value: T, ttlMs?: number, prefixes: string[] = []): void {
    const expiry = ttlMs ? Date.now() + ttlMs : null;
    
    this.cache.set(key, {
      value,
      expiry,
      createdAt: Date.now()
    });
    
    // Associate key with prefixes for group invalidation
    for (const prefix of prefixes) {
      if (!this.keyPrefixes.has(prefix)) {
        this.keyPrefixes.set(prefix, new Set());
      }
      this.keyPrefixes.get(prefix)?.add(key);
    }
    
    logger.debug('Cache set', { key, prefixes, ttlMs });
  }
  
  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    // Return null if item doesn't exist
    if (!item) {
      logger.debug('Cache miss', { key });
      return null;
    }
    
    // Check if item has expired
    if (item.expiry !== null && Date.now() > item.expiry) {
      this.delete(key);
      logger.debug('Cache expired', { key });
      return null;
    }
    
    logger.debug('Cache hit', { key });
    return item.value;
  }
  
  /**
   * Get a value from the cache or compute it if not present
   * @param key Cache key
   * @param fn Function to compute value if not in cache
   * @param ttlMs Time to live in milliseconds (optional)
   * @param prefixes Associated prefixes for group invalidation (optional)
   * @returns The cached or computed value
   */
  async getOrSet<T>(
    key: string, 
    fn: () => Promise<T>, 
    ttlMs?: number, 
    prefixes: string[] = []
  ): Promise<T> {
    const cachedValue = this.get<T>(key);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    // Value not in cache, compute it
    try {
      const computedValue = await fn();
      this.set(key, computedValue, ttlMs, prefixes);
      return computedValue;
    } catch (error) {
      logger.error('Error computing cached value', { key, error });
      throw error;
    }
  }
  
  /**
   * Delete a specific cache key
   * @param key Cache key to delete
   */
  delete(key: string): void {
    this.cache.delete(key);
    logger.debug('Cache delete', { key });
  }
  
  /**
   * Invalidate all cache entries with a specific prefix
   * @param prefix Prefix to invalidate
   */
  invalidateByPrefix(prefix: string): void {
    const keys = this.keyPrefixes.get(prefix);
    
    if (keys) {
      // Convert Set to Array before iterating
      Array.from(keys).forEach(key => {
        this.cache.delete(key);
      });
      this.keyPrefixes.delete(prefix);
      logger.debug('Cache invalidated by prefix', { prefix, keyCount: keys.size });
    }
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.keyPrefixes.clear();
    logger.debug('Cache cleared');
  }
  
  /**
   * Get cache statistics
   */
  getStats(): { size: number; prefixes: Record<string, number> } {
    const prefixStats: Record<string, number> = {};
    
    // Convert Map entries to Array before iterating
    Array.from(this.keyPrefixes.entries()).forEach(([prefix, keys]) => {
      prefixStats[prefix] = keys.size;
    });
    
    return {
      size: this.cache.size,
      prefixes: prefixStats
    };
  }
  
  /**
   * Remove expired items from the cache
   * @returns Number of items removed
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;
    
    // Convert Map entries to Array before iterating
    Array.from(this.cache.entries()).forEach(([key, item]) => {
      if (item.expiry !== null && now > item.expiry) {
        this.delete(key);
        removedCount++;
      }
    });
    
    logger.debug('Cache cleanup completed', { removedCount });
    return removedCount;
  }
}

// Create singleton instance
export const cacheService = new CacheService();

// Run cleanup every 5 minutes
setInterval(() => {
  cacheService.cleanup();
}, 5 * 60 * 1000);

export default cacheService; 