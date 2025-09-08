import { useReducer, useCallback, useMemo } from 'react';

export interface FilterState {
  search: string;
  minPosition: number;
  maxPosition: number;
  competitionLevel: string[];
  sortBy: 'keyword' | 'position';
  sortOrder: 'asc' | 'desc';
  showWinning: boolean;
  showLosing: boolean;
  showOpportunities: boolean;
}

type FilterAction =
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_POSITION_RANGE'; payload: { min: number; max: number } }
  | { type: 'SET_COMPETITION_LEVEL'; payload: string[] }
  | { type: 'SET_SORT'; payload: { sortBy: 'keyword' | 'position'; sortOrder: 'asc' | 'desc' } }
  | { type: 'TOGGLE_WINNING' }
  | { type: 'TOGGLE_LOSING' }
  | { type: 'TOGGLE_OPPORTUNITIES' }
  | { type: 'RESET_FILTERS' };

const initialState: FilterState = {
  search: '',
  minPosition: 1,
  maxPosition: 100,
  competitionLevel: [],
  sortBy: 'position',
  sortOrder: 'asc',
  showWinning: false,
  showLosing: false,
  showOpportunities: false,
};

function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, search: action.payload };
    case 'SET_POSITION_RANGE':
      return { ...state, minPosition: action.payload.min, maxPosition: action.payload.max };
    case 'SET_COMPETITION_LEVEL':
      return { ...state, competitionLevel: action.payload };
    case 'SET_SORT':
      return { ...state, sortBy: action.payload.sortBy, sortOrder: action.payload.sortOrder };
    case 'TOGGLE_WINNING':
      return { ...state, showWinning: !state.showWinning };
    case 'TOGGLE_LOSING':
      return { ...state, showLosing: !state.showLosing };
    case 'TOGGLE_OPPORTUNITIES':
      return { ...state, showOpportunities: !state.showOpportunities };
    case 'RESET_FILTERS':
      return initialState;
    default:
      return state;
  }
}

let debounceTimer: NodeJS.Timeout;

export function useOptimizedFilters() {
  const [filters, dispatch] = useReducer(filterReducer, initialState);

  const debouncedSetSearch = useCallback((search: string) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      dispatch({ type: 'SET_SEARCH', payload: search });
    }, 300);
  }, []);

  const setPositionRange = useCallback((min: number, max: number) => {
    dispatch({ type: 'SET_POSITION_RANGE', payload: { min, max } });
  }, []);

  const setCompetitionLevel = useCallback((levels: string[]) => {
    dispatch({ type: 'SET_COMPETITION_LEVEL', payload: levels });
  }, []);

  const setSort = useCallback((sortBy: 'keyword' | 'position', sortOrder: 'asc' | 'desc') => {
    dispatch({ type: 'SET_SORT', payload: { sortBy, sortOrder } });
  }, []);

  const toggleWinning = useCallback(() => dispatch({ type: 'TOGGLE_WINNING' }), []);
  const toggleLosing = useCallback(() => dispatch({ type: 'TOGGLE_LOSING' }), []);
  const toggleOpportunities = useCallback(() => dispatch({ type: 'TOGGLE_OPPORTUNITIES' }), []);
  const resetFilters = useCallback(() => dispatch({ type: 'RESET_FILTERS' }), []);

  const filterActions = useMemo(() => ({
    setSearch: debouncedSetSearch,
    setPositionRange,
    setCompetitionLevel,
    setSort,
    toggleWinning,
    toggleLosing,
    toggleOpportunities,
    resetFilters,
  }), [debouncedSetSearch, setPositionRange, setCompetitionLevel, setSort, toggleWinning, toggleLosing, toggleOpportunities, resetFilters]);

  return { filters, filterActions };
}