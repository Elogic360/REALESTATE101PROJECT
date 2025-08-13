// Security utilities for production deployment

export class SecurityUtils {
  // Content Security Policy configuration
  static getCSPDirectives(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ];
    
    return directives.join('; ');
  }

  // Sanitize user input
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  // Validate phone number format
  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/[\s-()]/g, ''));
  }

  // Generate secure random string
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Rate limiting helper
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();
    
    return (identifier: string): boolean => {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      if (!requests.has(identifier)) {
        requests.set(identifier, []);
      }
      
      const userRequests = requests.get(identifier)!;
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => time > windowStart);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }
      
      validRequests.push(now);
      requests.set(identifier, validRequests);
      
      return true; // Request allowed
    };
  }

  // Secure storage wrapper
  static secureStorage = {
    setItem(key: string, value: string): void {
      try {
        const encrypted = btoa(value); // Basic encoding (use proper encryption in production)
        localStorage.setItem(key, encrypted);
      } catch (error) {
        console.error('Failed to store item securely:', error);
      }
    },
    
    getItem(key: string): string | null {
      try {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) return null;
        return atob(encrypted); // Basic decoding
      } catch (error) {
        console.error('Failed to retrieve item securely:', error);
        return null;
      }
    },
    
    removeItem(key: string): void {
      localStorage.removeItem(key);
    }
  };

  // Environment validation
  static validateEnvironment(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!import.meta.env.VITE_SUPABASE_URL) {
      errors.push('VITE_SUPABASE_URL is not configured');
    }
    
    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      errors.push('VITE_SUPABASE_ANON_KEY is not configured');
    }
    
    // Validate Supabase URL format
    if (import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.startsWith('https://')) {
      errors.push('VITE_SUPABASE_URL must use HTTPS');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // HTTPS redirect for production
  static enforceHTTPS(): void {
    if (import.meta.env.PROD && location.protocol !== 'https:') {
      location.replace(`https:${location.href.substring(location.protocol.length)}`);
    }
  }
}

// Initialize security measures
if (import.meta.env.PROD) {
  // Enforce HTTPS
  SecurityUtils.enforceHTTPS();
  
  // Validate environment
  const envValidation = SecurityUtils.validateEnvironment();
  if (!envValidation.valid) {
    console.error('Environment validation failed:', envValidation.errors);
  }
  
  // Set CSP header if supported
  if (import.meta.env.VITE_ENABLE_CSP === 'true') {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = SecurityUtils.getCSPDirectives();
    document.head.appendChild(meta);
  }
}