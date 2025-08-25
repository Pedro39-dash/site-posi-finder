import { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { toast } from "@/hooks/use-toast";

export interface MonitoredSite {
  id: string;
  website: string;
  keywords: string[];
  frequency: 'daily' | 'weekly';
  createdAt: Date;
  lastCheck: Date | null;
  status: 'active' | 'paused';
}

export interface PositionHistory {
  siteId: string;
  keyword: string;
  position: number | null;
  date: Date;
}

interface MonitoringState {
  sites: MonitoredSite[];
  history: PositionHistory[];
  isLoading: boolean;
}

type MonitoringAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_SITE'; payload: MonitoredSite }
  | { type: 'REMOVE_SITE'; payload: string }
  | { type: 'UPDATE_SITE'; payload: { id: string; updates: Partial<MonitoredSite> } }
  | { type: 'ADD_HISTORY'; payload: PositionHistory[] }
  | { type: 'LOAD_DATA'; payload: { sites: MonitoredSite[]; history: PositionHistory[] } };

const initialState: MonitoringState = {
  sites: [],
  history: [],
  isLoading: false,
};

const monitoringReducer = (state: MonitoringState, action: MonitoringAction): MonitoringState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'ADD_SITE':
      return { ...state, sites: [...state.sites, action.payload] };
    case 'REMOVE_SITE':
      return { 
        ...state, 
        sites: state.sites.filter(site => site.id !== action.payload),
        history: state.history.filter(h => h.siteId !== action.payload)
      };
    case 'UPDATE_SITE':
      return {
        ...state,
        sites: state.sites.map(site => 
          site.id === action.payload.id 
            ? { ...site, ...action.payload.updates }
            : site
        )
      };
    case 'ADD_HISTORY':
      return { ...state, history: [...state.history, ...action.payload] };
    case 'LOAD_DATA':
      return { 
        ...state, 
        sites: action.payload.sites, 
        history: action.payload.history 
      };
    default:
      return state;
  }
};

interface MonitoringContextType extends MonitoringState {
  addSite: (website: string, keywords: string[], frequency: 'daily' | 'weekly') => void;
  removeSite: (id: string) => void;
  toggleSiteStatus: (id: string) => void;
  runCheck: (siteId: string) => Promise<void>;
  getSiteHistory: (siteId: string, keyword?: string) => PositionHistory[];
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

export const useMonitoring = () => {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
};

// Mock function to simulate position checking
const generatePositionData = (website: string, keywords: string[]): PositionHistory[] => {
  return keywords.map(keyword => {
    const rand = Math.random();
    let position: number | null = null;
    
    if (rand > 0.15) {
      if (rand > 0.85) {
        position = Math.floor(Math.random() * 3) + 1;
      } else if (rand > 0.60) {
        position = Math.floor(Math.random() * 7) + 4;
      } else {
        position = Math.floor(Math.random() * 90) + 11;
      }
    }

    return {
      siteId: website,
      keyword,
      position,
      date: new Date(),
    };
  });
};

export const MonitoringProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(monitoringReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedSites = localStorage.getItem('monitoring_sites');
    const savedHistory = localStorage.getItem('monitoring_history');
    
    if (savedSites || savedHistory) {
      dispatch({
        type: 'LOAD_DATA',
        payload: {
          sites: savedSites ? JSON.parse(savedSites).map((site: any) => ({
            ...site,
            createdAt: new Date(site.createdAt),
            lastCheck: site.lastCheck ? new Date(site.lastCheck) : null,
          })) : [],
          history: savedHistory ? JSON.parse(savedHistory).map((h: any) => ({
            ...h,
            date: new Date(h.date),
          })) : [],
        }
      });
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('monitoring_sites', JSON.stringify(state.sites));
    localStorage.setItem('monitoring_history', JSON.stringify(state.history));
  }, [state.sites, state.history]);

  const addSite = (website: string, keywords: string[], frequency: 'daily' | 'weekly') => {
    const newSite: MonitoredSite = {
      id: `${website}_${Date.now()}`,
      website,
      keywords,
      frequency,
      createdAt: new Date(),
      lastCheck: null,
      status: 'active',
    };

    dispatch({ type: 'ADD_SITE', payload: newSite });
    
    toast({
      title: "Site adicionado ao monitoramento",
      description: `${website} será verificado ${frequency === 'daily' ? 'diariamente' : 'semanalmente'}`,
    });
  };

  const removeSite = (id: string) => {
    dispatch({ type: 'REMOVE_SITE', payload: id });
    toast({
      title: "Site removido do monitoramento",
      description: "O histórico também foi removido",
    });
  };

  const toggleSiteStatus = (id: string) => {
    const site = state.sites.find(s => s.id === id);
    if (site) {
      const newStatus = site.status === 'active' ? 'paused' : 'active';
      dispatch({ 
        type: 'UPDATE_SITE', 
        payload: { id, updates: { status: newStatus } } 
      });
      
      toast({
        title: `Monitoramento ${newStatus === 'active' ? 'ativado' : 'pausado'}`,
        description: site.website,
      });
    }
  };

  const runCheck = async (siteId: string) => {
    const site = state.sites.find(s => s.id === siteId);
    if (!site) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newHistory = generatePositionData(site.website, site.keywords);
      dispatch({ type: 'ADD_HISTORY', payload: newHistory });
      dispatch({ 
        type: 'UPDATE_SITE', 
        payload: { id: siteId, updates: { lastCheck: new Date() } } 
      });

      toast({
        title: "Verificação concluída",
        description: `Posições atualizadas para ${site.website}`,
      });
    } catch (error) {
      toast({
        title: "Erro na verificação",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getSiteHistory = (siteId: string, keyword?: string) => {
    return state.history
      .filter(h => h.siteId === siteId && (!keyword || h.keyword === keyword))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  return (
    <MonitoringContext.Provider
      value={{
        ...state,
        addSite,
        removeSite,
        toggleSiteStatus,
        runCheck,
        getSiteHistory,
      }}
    >
      {children}
    </MonitoringContext.Provider>
  );
};