/**
 * Cache clearing utilities for resolving hook instability
 */

export const clearBrowserCache = (): void => {
  // Clear localStorage
  try {
    localStorage.clear();
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }

  // Clear sessionStorage
  try {
    sessionStorage.clear();
  } catch (e) {
    console.warn('Failed to clear sessionStorage:', e);
  }

  // Force reload with cache bypass
  if (typeof window !== 'undefined') {
    window.location.reload();
  }
};

export const forceComponentRefresh = (): string => {
  // Generate unique timestamp to force component refresh
  return Date.now().toString();
};

export const getDebugInfo = () => {
  return {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    localStorage: Object.keys(localStorage).length,
    sessionStorage: Object.keys(sessionStorage).length,
    url: window.location.href
  };
};

// Clear component cache on critical errors
export const handleCriticalError = (error: Error) => {
  console.error('🔥 CRITICAL ERROR DETECTED:', error);
  console.log('🧹 Clearing caches to resolve instability...');
  
  // Clear React-specific caches
  try {
    // Clear any React dev tools cache
    if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = null;
    }
  } catch (e) {
    console.warn('Failed to clear React dev tools cache:', e);
  }
  
  // Force a clean reload
  setTimeout(() => {
    clearBrowserCache();
  }, 1000);
};