'use client';

import { useEffect, useState, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  timeout?: number;
};

export function DeferredOnIdle({ children, timeout = 250 }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) {
      const id = ric(() => setReady(true), { timeout });
      return () => {
        const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
        cic?.(id);
      };
    }
    const t = window.setTimeout(() => setReady(true), timeout);
    return () => window.clearTimeout(t);
  }, [timeout]);

  return ready ? <>{children}</> : null;
}
