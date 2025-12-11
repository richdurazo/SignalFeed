/**
 * Input validation utilities for SignalFeed
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates and sanitizes search topic input
 */
export function validateTopic(topic: string): ValidationResult {
  // Trim whitespace
  const trimmed = topic.trim();

  // Check if empty
  if (!trimmed) {
    return {
      isValid: false,
      error: "Please enter a topic to search for",
    };
  }

  // Check minimum length
  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: "Topic must be at least 2 characters long",
    };
  }

  // Check maximum length (prevent abuse)
  if (trimmed.length > 200) {
    return {
      isValid: false,
      error: "Topic must be less than 200 characters",
    };
  }

  // Check for potentially malicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /data:text\/html/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isValid: false,
        error: "Invalid characters detected in search query",
      };
    }
  }

  // Check for excessive special characters (likely spam/abuse)
  const specialCharCount = (trimmed.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length;
  if (specialCharCount > trimmed.length * 0.5) {
    return {
      isValid: false,
      error: "Search query contains too many special characters",
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Sanitizes topic input by removing potentially dangerous characters
 */
export function sanitizeTopic(topic: string): string {
  return topic
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .slice(0, 200); // Enforce max length
}

/**
 * Validates URL to prevent XSS
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

