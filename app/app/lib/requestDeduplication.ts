/**
 * Request deduplication utility
 * Prevents duplicate concurrent requests with the same parameters
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest<any>> = new Map();
  private readonly maxAge = 30000; // 30 seconds max age for pending requests

  /**
   * Execute a request, reusing pending request if it exists
   * @param key - Unique key for the request (e.g., JSON.stringify(params))
   * @param requestFn - Function that returns a promise
   * @returns Promise that resolves to the request result
   */
  async execute<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if there's a pending request
    const pending = this.pendingRequests.get(key);

    if (pending) {
      // Check if request is still fresh
      const age = Date.now() - pending.timestamp;
      if (age < this.maxAge) {
        if (process.env.NODE_ENV === "development") {
          console.log(`[RequestDeduplication] Reusing pending request for key: ${key}`);
        }
        return pending.promise;
      } else {
        // Request is stale, remove it
        this.pendingRequests.delete(key);
      }
    }

    // Create new request
    const promise = requestFn().finally(() => {
      // Clean up after request completes
      this.pendingRequests.delete(key);
    });

    // Store pending request
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Get number of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }
}

export const requestDeduplicator = new RequestDeduplicator();

/**
 * Create a deduplication key from request parameters
 */
export function createRequestKey(operation: string, variables: Record<string, any>): string {
  return `${operation}:${JSON.stringify(variables)}`;
}

