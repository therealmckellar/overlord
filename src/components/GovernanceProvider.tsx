'use client';

import React, { useEffect } from 'react';
import { GovernanceGate } from '@/components/GovernanceGate';

export default function GovernanceProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GovernanceGate />
    </>
  );
}
