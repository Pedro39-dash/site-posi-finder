/**
 * Hook stability monitor for development - helps catch hook consistency issues
 */
import React from 'react';

interface ComponentHookState {
  name: string;
  hookCount: number;
  lastHookCount: number;
  renderCount: number;
}

class HookStabilityMonitor {
  private static components: Map<string, ComponentHookState> = new Map();
  private static isEnabled = process.env.NODE_ENV === 'development';

  static trackComponent(componentName: string, hookCount: number) {
    if (!this.isEnabled) return;

    const existing = this.components.get(componentName);
    if (!existing) {
      this.components.set(componentName, {
        name: componentName,
        hookCount,
        lastHookCount: hookCount,
        renderCount: 1
      });
      console.log(`🪝 [HookMonitor] ${componentName}: Initial hooks = ${hookCount}`);
      return;
    }

    existing.renderCount++;
    existing.lastHookCount = existing.hookCount;
    existing.hookCount = hookCount;

    // Detect hook count changes
    if (existing.hookCount !== existing.lastHookCount) {
      console.error(`🚨 [HookMonitor] ${componentName}: Hook count changed! Previous: ${existing.lastHookCount}, Current: ${existing.hookCount}`);
      console.error(`This will cause React error #310: "Rendered more hooks than during the previous render"`);
    }

    // Log excessive renders
    if (existing.renderCount > 50 && existing.renderCount % 10 === 0) {
      console.warn(`⚠️ [HookMonitor] ${componentName}: High render count = ${existing.renderCount}`);
    }
  }

  static getStats() {
    if (!this.isEnabled) return {};
    
    const stats: Record<string, ComponentHookState> = {};
    this.components.forEach((state, name) => {
      stats[name] = { ...state };
    });
    return stats;
  }

  static reset() {
    this.components.clear();
  }
}

export default HookStabilityMonitor;

/**
 * Development hook to track hook stability
 */
export const useHookStabilityTracking = (componentName: string) => {
  if (process.env.NODE_ENV === 'development') {
    // This must be called at the very end of your component after all other hooks
    let hookCount = 0;
    
    // Count hooks by trying to use them (this is a hack for development only)
    try {
      // This is a development-only hook counter
      const fakeRefs = [];
      for (let i = 0; i < 100; i++) {
        try {
          // eslint-disable-next-line react-hooks/rules-of-hooks
          fakeRefs.push(React.useRef());
          hookCount = i + 1;
        } catch {
          break;
        }
      }
    } catch {
      // Expected to fail when we exceed hook count
    }
    
    HookStabilityMonitor.trackComponent(componentName, hookCount);
  }
};