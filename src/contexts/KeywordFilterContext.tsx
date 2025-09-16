import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CompetitorKeyword } from '@/services/competitorAnalysisService';

interface KeywordFilterContextType {
  selectedKeyword: CompetitorKeyword | null;
  setSelectedKeyword: (keyword: CompetitorKeyword) => void;
}

const KeywordFilterContext = createContext<KeywordFilterContextType | undefined>(undefined);

interface KeywordFilterProviderProps {
  children: ReactNode;
}

export const KeywordFilterProvider: React.FC<KeywordFilterProviderProps> = ({ children }) => {
  const [selectedKeyword, setSelectedKeyword] = useState<CompetitorKeyword | null>(null);

  return (
    <KeywordFilterContext.Provider value={{
      selectedKeyword,
      setSelectedKeyword: (keyword: CompetitorKeyword) => setSelectedKeyword(keyword)
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