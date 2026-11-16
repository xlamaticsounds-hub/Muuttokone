'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/attribution-client';

// Tallentaa muistiin, mistä kävijä tuli sivustolle (ks. lib/attribution-client.ts). Ei renderöi mitään.
export default function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
