'use client';

import { useEffect } from 'react';

export function ScrollReady() {
  useEffect(() => {
    document.body.classList.add('is-ready');
  }, []);

  return null;
}
