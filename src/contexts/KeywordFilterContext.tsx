import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CompetitorKeyword } from '@/services/competitorAnalysisService';
import { DeepAnalysisData } from '@/services/deepAnalysisService';

interface KeywordFilterContextType {
  selectedKeyword: CompetitorKeyword | null;
  setSelectedKeyword: (keyword: CompetitorKeyword) => void;
  deepAnalysisData: DeepAnalysisData | null;
  setDeepAnalysisData: (data: DeepAnalysisData | null) => void;
}

const KeywordFilterContext = createContext<KeywordFilterContextType | undefined>(undefined);

interface KeywordFilterProviderProps {
  children: ReactNode;
}

export const KeywordFilterProvider: React.FC<KeywordFilterProviderProps> = ({ children }) => {
  const [selectedKeyword, setSelectedKeyword] = useState<CompetitorKeyword | null>(null);
  const [deepAnalysisData, setDeepAnalysisData] = useState<DeepAnalysisData | null>(null);

  return (
    <KeywordFilterContext.Provider value={{
      selectedKeyword,
      setSelectedKeyword: (keyword: CompetitorKeyword) => setSelectedKeyword(keyword),
      deepAnalysisData,
      setDeepAnalysisData
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