/**
 * Hook stability testing utilities
 */

import React from 'react';

export interface StabilityTestResult {
  isStable: boolean;
  issues: string[];
  recommendations: string[];
  score: number; // 0-100
}

/**
 * Test hook stability by analyzing dependencies and render patterns
 */
export const testHookStability = (
  hookName: string,
  dependencies: any[],
  renderCount: number
): StabilityTestResult => {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Check for excessive renders
  if (renderCount > 10) {
    issues.push(`Excessive renders: ${renderCount} times`);
    score -= 30;
    recommendations.push('Consider using useCallback or useMemo for dependencies');
  }

  // Check for unstable dependencies
  dependencies.forEach((dep, index) => {
    if (typeof dep === 'object' && dep !== null) {
      if (Array.isArray(dep)) {
        issues.push(`Dependency ${index} is an array - may cause instability`);
        score -= 10;
        recommendations.push(`Use JSON.stringify() or useDeepMemo for array dependency ${index}`);
      } else {
        issues.push(`Dependency ${index} is an object - may cause instability`);
        score -= 15;
        recommendations.push(`Extract primitive values from object dependency ${index}`);
      }
    }
    
    if (typeof dep === 'function') {
      issues.push(`Dependency ${index} is a function - may cause instability`);
      score -= 20;
      recommendations.push(`Wrap function dependency ${index} with useCallback`);
    }
  });

  // Check for complex nested structures
  const hasComplexNesting = dependencies.some(dep => {
    try {
      const str = JSON.stringify(dep);
      return str.includes('[[') || str.includes('{{');
    } catch {
      return true; // Circular references are definitely complex
    }
  });

  if (hasComplexNesting) {
    issues.push('Complex nested structures detected in dependencies');
    score -= 25;
    recommendations.push('Flatten complex structures or use primitive extractions');
  }

  return {
    isStable: issues.length === 0 && renderCount <= 3,
    issues,
    recommendations,
    score: Math.max(0, score)
  };
};

/**
 * Generate stability report for multiple hooks
 */
export const generateStabilityReport = (tests: Array<{
  hookName: string;
  dependencies: any[];
  renderCount: number;
}>): { 
  overallScore: number;
  results: Array<StabilityTestResult & { hookName: string }>;
  criticalIssues: string[];
} => {
  const results = tests.map(test => ({
    hookName: test.hookName,
    ...testHookStability(test.hookName, test.dependencies, test.renderCount)
  }));

  const overallScore = results.length > 0 
    ? Math.round(results.reduce((sum, result) => sum + result.score, 0) / results.length)
    : 0;

  const criticalIssues = results
    .filter(result => result.score < 50)
    .map(result => `${result.hookName}: ${result.issues.join(', ')}`);

  return {
    overallScore,
    results,
    criticalIssues
  };
};

/**
 * Hook stability validator - use in development
 */
export const useStabilityValidator = (
  hookName: string, 
  dependencies: any[]
) => {
  if (process.env.NODE_ENV !== 'development') return null;

  const renderCount = React.useRef(0);
  const [stability, setStability] = React.useState<StabilityTestResult | null>(null);

  React.useEffect(() => {
    renderCount.current += 1;
    
    const result = testHookStability(hookName, dependencies, renderCount.current);
    setStability(result);
    
    if (!result.isStable) {
      console.warn(`🚨 Hook Stability Issue: ${hookName}`, result);
    }
  }, [hookName, ...dependencies]);

  return stability;
};