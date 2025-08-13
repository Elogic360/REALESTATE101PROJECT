// Performance optimization utilities

export class PerformanceUtils {
  private static performanceEntries: PerformanceEntry[] = [];
  private static observers: PerformanceObserver[] = [];

  // Initialize performance monitoring
  static initialize(): void {
    if (!import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING) return;

    this.setupPerformanceObservers();
    this.setupResourceMonitoring();
    this.setupUserTimingAPI();
  }

  // Setup performance observers
  private static setupPerformanceObservers(): void {
    try {
      // Observe navigation timing
      const navObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            this.logNavigationTiming(entry as PerformanceNavigationTiming);
          }
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Observe resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            this.logResourceTiming(entry as PerformanceResourceTiming);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // Observe first input delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          console.log('FID:', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

    } catch (error) {
      console.warn('Performance observers not supported:', error);
    }
  }

  // Setup resource monitoring
  private static setupResourceMonitoring(): void {
    // Monitor bundle size
    this.measureBundleSize();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Monitor network conditions
    this.monitorNetworkConditions();
  }

  // Setup User Timing API
  private static setupUserTimingAPI(): void {
    // Mark important application events
    performance.mark('app-start');
    
    // Measure time to interactive
    document.addEventListener('DOMContentLoaded', () => {
      performance.mark('dom-content-loaded');
      performance.measure('dom-loading', 'app-start', 'dom-content-loaded');
    });

    window.addEventListener('load', () => {
      performance.mark('window-loaded');
      performance.measure('full-loading', 'app-start', 'window-loaded');
    });
  }

  // Log navigation timing
  private static logNavigationTiming(entry: PerformanceNavigationTiming): void {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ssl: entry.connectEnd - entry.secureConnectionStart,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      domProcessing: entry.domContentLoadedEventStart - entry.responseEnd,
      domComplete: entry.domComplete - entry.domContentLoadedEventStart,
      loadComplete: entry.loadEventEnd - entry.loadEventStart,
      total: entry.loadEventEnd - entry.navigationStart
    };

    console.group('Navigation Timing');
    console.table(metrics);
    console.groupEnd();

    // Send to analytics if configured
    this.sendToAnalytics('navigation', metrics);
  }

  // Log resource timing
  private static logResourceTiming(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.startTime;
    
    // Log slow resources (> 1 second)
    if (duration > 1000) {
      console.warn(`Slow resource: ${entry.name} took ${duration.toFixed(2)}ms`);
    }

    // Track resource types
    const resourceType = this.getResourceType(entry.name);
    this.sendToAnalytics('resource', {
      name: entry.name,
      type: resourceType,
      duration,
      size: entry.transferSize
    });
  }

  // Measure bundle size
  private static measureBundleSize(): void {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    let totalSize = 0;
    
    const measureResource = (url: string) => {
      const entry = performance.getEntriesByName(url)[0] as PerformanceResourceTiming;
      if (entry) {
        totalSize += entry.transferSize || 0;
      }
    };

    scripts.forEach(script => {
      const src = (script as HTMLScriptElement).src;
      if (src) measureResource(src);
    });

    styles.forEach(style => {
      const href = (style as HTMLLinkElement).href;
      if (href) measureResource(href);
    });

    console.log(`Total bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
  }

  // Monitor memory usage
  private static monitorMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryInfo = {
        used: Math.round(memory.usedJSHeapSize / 1048576),
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576)
      };

      console.log('Memory usage:', memoryInfo);
      
      // Warn if memory usage is high
      if (memoryInfo.used > memoryInfo.limit * 0.8) {
        console.warn('High memory usage detected');
      }
    }
  }

  // Monitor network conditions
  private static monitorNetworkConditions(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const networkInfo = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };

      console.log('Network conditions:', networkInfo);
      
      // Adapt behavior based on network conditions
      if (connection.saveData || connection.effectiveType === 'slow-2g') {
        console.log('Slow network detected, enabling data saving mode');
        document.body.classList.add('data-saver-mode');
      }
    }
  }

  // Get resource type from URL
  private static getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
    return 'other';
  }

  // Send metrics to analytics
  private static sendToAnalytics(type: string, data: any): void {
    // Send to Google Analytics if configured
    if (import.meta.env.VITE_GA_TRACKING_ID && typeof gtag !== 'undefined') {
      gtag('event', 'performance', {
        event_category: type,
        event_label: JSON.stringify(data),
        value: Math.round(data.duration || data.total || 0)
      });
    }

    // Send to custom analytics endpoint
    if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
      fetch(import.meta.env.VITE_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data, timestamp: Date.now() })
      }).catch(error => console.error('Analytics error:', error));
    }
  }

  // Measure custom timing
  static measureTiming(name: string, startMark: string, endMark?: string): void {
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.mark(endMark || `${name}-end`);
        performance.measure(name, startMark, endMark || `${name}-end`);
      }

      const measure = performance.getEntriesByName(name)[0];
      console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
    } catch (error) {
      console.warn(`Failed to measure timing for ${name}:`, error);
    }
  }

  // Mark performance milestone
  static mark(name: string): void {
    try {
      performance.mark(name);
    } catch (error) {
      console.warn(`Failed to mark ${name}:`, error);
    }
  }

  // Get performance metrics
  static getMetrics(): any {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      navigation: navigation ? {
        loadTime: navigation.loadEventEnd - navigation.navigationStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        firstByte: navigation.responseStart - navigation.navigationStart
      } : null,
      paint: paint.reduce((acc, entry) => {
        acc[entry.name] = entry.startTime;
        return acc;
      }, {} as any),
      memory: 'memory' in performance ? {
        used: Math.round(((performance as any).memory.usedJSHeapSize / 1048576)),
        total: Math.round(((performance as any).memory.totalJSHeapSize / 1048576))
      } : null
    };
  }

  // Cleanup observers
  static cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  PerformanceUtils.initialize();
}