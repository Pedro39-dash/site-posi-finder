/**
 * Rendering diagnostics utility for detecting and debugging hook issues
 */

import React from 'react';

interface RenderLog {
  component: string;
  timestamp: number;
  renderCount: number;
  cause?: string;
}

class RenderingDiagnostics {
  private static renderCounts = new Map<string, number>();
  private static renderLogs: RenderLog[] = [];
  private static maxLogs = 100;

  /**
   * Track component renders to detect excessive re-renders
   */
  static trackRender(componentName: string, cause?: string): void {
    const currentCount = this.renderCounts.get(componentName) || 0;
    const newCount = currentCount + 1;
    
    this.renderCounts.set(componentName, newCount);
    
    // Log the render
    const log: RenderLog = {
      component: componentName,
      timestamp: Date.now(),
      renderCount: newCount,
      cause
    };
    
    this.renderLogs.push(log);
    
    // Keep only recent logs
    if (this.renderLogs.length > this.maxLogs) {
      this.renderLogs.shift();
    }
    
    // Warn about excessive renders
    if (newCount > 10) {
      console.warn(`⚠️ Excessive renders detected for ${componentName}: ${newCount} renders`, {
        cause,
        recentRenders: this.getRecentRenders(componentName, 5)
      });
    }
    
    // Debug log for development
    if (process.env.NODE_ENV === 'development' && cause) {
      console.log(`🔄 ${componentName} rendered (${newCount}x): ${cause}`);
    }
  }

  /**
   * Get recent renders for a component
   */
  static getRecentRenders(componentName: string, count = 10): RenderLog[] {
    return this.renderLogs
      .filter(log => log.component === componentName)
      .slice(-count);
  }

  /**
   * Get all render statistics
   */
  static getStats() {
    return {
      totalComponents: this.renderCounts.size,
      renderCounts: Object.fromEntries(this.renderCounts),
      recentLogs: this.renderLogs.slice(-20),
      excessiveRenderComponents: Array.from(this.renderCounts.entries())
        .filter(([, count]) => count > 5)
        .map(([component, count]) => ({ component, count }))
    };
  }

  /**
   * Reset all tracking data
   */
  static reset(): void {
    this.renderCounts.clear();
    this.renderLogs.length = 0;
  }

  /**
   * Check if a component has stable rendering
   */
  static isStable(componentName: string, maxRenders = 3): boolean {
    const count = this.renderCounts.get(componentName) || 0;
    return count <= maxRenders;
  }
}

/**
 * React hook to track component renders
 */
export const useRenderTracking = (componentName: string, dependencies?: any[]) => {
  const renderCount = React.useRef(0);
  
  React.useEffect(() => {
    renderCount.current += 1;
    
    let cause = 'unknown';
    if (dependencies) {
      cause = `deps: ${dependencies.map(dep => 
        typeof dep === 'object' ? JSON.stringify(dep) : String(dep)
      ).join(', ')}`;
    }
    
    RenderingDiagnostics.trackRender(componentName, cause);
  });
  
  return {
    renderCount: renderCount.current,
    isStable: RenderingDiagnostics.isStable(componentName)
  };
};

/**
 * Development-only render debugger
 */
export const useRenderDebugger = (componentName: string, props?: any) => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const prevProps = React.useRef(props);
  const renderCount = React.useRef(0);
  
  React.useEffect(() => {
    renderCount.current += 1;
    
    if (props && prevProps.current) {
      const changedProps = Object.keys(props).filter(
        key => props[key] !== prevProps.current[key]
      );
      
      if (changedProps.length > 0) {
        console.log(`🔍 ${componentName} re-render #${renderCount.current}:`, {
          changedProps,
          oldProps: Object.fromEntries(changedProps.map(key => [key, prevProps.current[key]])),
          newProps: Object.fromEntries(changedProps.map(key => [key, props[key]]))
        });
      }
    }
    
    prevProps.current = props;
    RenderingDiagnostics.trackRender(componentName, `render #${renderCount.current}`);
  });
};

export default RenderingDiagnostics;
