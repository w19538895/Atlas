'use client';

import { AuthProvider } from '@/lib/auth-context';
import { LocationProvider } from '@/lib/LocationContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocationProvider>
      <AuthProvider>{children}</AuthProvider>
    </LocationProvider>
  );
}