import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CompetitorKeyword } from '@/services/competitorAnalysisService';

interface KeywordFilterContextType {
  selectedKeyword: CompetitorKeyword | null;
  isAllKeywords: boolean;
  setSelectedKeyword: (keyword: CompetitorKeyword | null) => void;
  setAllKeywords: () => void;
}

const KeywordFilterContext = createContext<KeywordFilterContextType | undefined>(undefined);

interface KeywordFilterProviderProps {
  children: ReactNode;
}

export const KeywordFilterProvider: React.FC<KeywordFilterProviderProps> = ({ children }) => {
  const [selectedKeyword, setSelectedKeywordState] = useState<CompetitorKeyword | null>(null);
  const [isAllKeywords, setIsAllKeywords] = useState(true);

  const setSelectedKeyword = (keyword: CompetitorKeyword | null) => {
    setSelectedKeywordState(keyword);
    setIsAllKeywords(keyword === null);
  };

  const setAllKeywords = () => {
    setSelectedKeywordState(null);
    setIsAllKeywords(true);
  };

  return (
    <KeywordFilterContext.Provider value={{
      selectedKeyword,
      isAllKeywords,
      setSelectedKeyword,
      setAllKeywords
    }}>
      {children}
    </KeywordFilterContext.Provider>
  );
};

export const useKeywordFilter = () => {
  const context = useContext(KeywordFilterContext);
  if (context === undefined) {
    throw new Error('useKeywordFilter must be used within a KeywordFilterProvider');
  }
  return context;
};