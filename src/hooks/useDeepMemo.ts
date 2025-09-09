import { useMemo, useRef } from 'react';

/**
 * Deep comparison memoization hook to prevent unnecessary re-renders
 * with complex objects and arrays
 */
export const useDeepMemo = <T>(factory: () => T, deps: any[]): T => {
  const prevDepsRef = useRef<any[]>([]);
  const prevResultRef = useRef<T>();

  // Deep compare dependencies
  const depsChanged = useMemo(() => {
    if (prevDepsRef.current.length !== deps.length) return true;
    
    return deps.some((dep, index) => {
      const prevDep = prevDepsRef.current[index];
      return !deepEqual(dep, prevDep);
    });
  }, deps);

  if (depsChanged || prevResultRef.current === undefined) {
    prevDepsRef.current = deps;
    prevResultRef.current = factory();
  }

  return prevResultRef.current as T;
};

/**
 * Stable hook for arrays with primitive comparison
 */
export const useStableArray = <T>(arr: T[]): T[] => {
  return useMemo(() => {
    if (!arr || !Array.isArray(arr)) return [];
    
    // Create normalized copy with stable references
    return arr.map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        // For objects, create stable reference based on content
        return { ...item };
      }
      return item;
    });
  }, [JSON.stringify(arr)]);
};

/**
 * Primitive-only dependencies to ensure stability
 */
export const usePrimitiveMemo = <T>(factory: () => T, primitives: (string | number | boolean | null | undefined)[]): T => {
  return useMemo(factory, primitives);
};

// Simple deep equality check for basic objects and arrays
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => deepEqual(a[key], b[key]));
}