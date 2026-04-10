// @ts-nocheck
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useData } from './use-data';

type DataContextType = ReturnType<typeof useData>;

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const data = useData();
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useAppData must be used within DataProvider');
  return ctx;
}
