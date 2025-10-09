import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SimulatedDataState {
  isSimulatedMode: boolean;
  enableSimulatedMode: () => void;
  disableSimulatedMode: () => void;
  toggleSimulatedMode: () => void;
}

export const useSimulatedData = create<SimulatedDataState>()(
  persist(
    (set) => ({
      isSimulatedMode: false,
      enableSimulatedMode: () => set({ isSimulatedMode: true }),
      disableSimulatedMode: () => set({ isSimulatedMode: false }),
      toggleSimulatedMode: () => set((state) => ({ 
        isSimulatedMode: !state.isSimulatedMode 
      })),
    }),
    {
      name: 'simulated-data-storage',
    }
  )
);
