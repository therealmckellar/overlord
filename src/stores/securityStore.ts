import { create } from 'zustand';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface SecurityFinding {
  severity: Severity;
  cwe: string;
  file: string;
  line: number;
  description: string;
  remediation: string;
  category: string;
}

interface SecurityState {
  scanResults: {
    score: number;
    findings: SecurityFinding[];
    timestamp: string;
    target: string;
  } | null;
  isScanning: boolean;
  reports: any[];
  setScanResults: (results: { score: number, findings: SecurityFinding[], target: string }) => void;
  setIsScanning: (scanning: boolean) => void;
  setReports: (reports: any[]) => void;
}

export const useSecurityStore = create<SecurityState>((set) => ({
  scanResults: null,
  isScanning: false,
  reports: [],
  setScanResults: (results) => set({ 
    scanResults: { 
      ...results, 
      timestamp: new Date().toISOString() 
    } 
  }),
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  setReports: (reports) => set({ reports }),
}));
