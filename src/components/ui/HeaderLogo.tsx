'use client';

import { useEffect, useState, useRef } from 'react';
import { useUIStore } from '@/store/uiStore';

export default function HeaderLogo() {
  const { theme } = useUIStore();
  const [svg, setSvg] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const logoFile = theme === 'dark' 
    ? '/logo-theme/vangatypepanalam_logo_exact.svg' 
    : '/logo-theme/logo.svg';

  useEffect(() => {
    fetch(logoFile)
      .then((r) => r.text())
      .then((text) => setSvg(text));
  }, [logoFile]);

  useEffect(() => {
    if (ref.current) {
      const el = ref.current.querySelector('svg');
      if (el && logoFile === '/logo-theme/logo.svg') {
        el.setAttribute('data-theme', theme);
      }
    }
  }, [theme, logoFile]);

  if (!svg) return null;

  return <div ref={ref} className="header-logo-svg" dangerouslySetInnerHTML={{ __html: svg }} />;
}