// modules/admin/shared/hooks/useAdminAuth.ts
// PORTED FROM CERTISTRY-APP - FULL CODE (adapted for CertistryLMS auth)
"use client";

import { useState, useEffect, useCallback } from 'react';
import { checkAdminRole } from '@/modules/admin/shared/serverActions/admin-auth.action';

export type AuthState = 'loading' | 'authenticated' | 'unauthorized' | 'unauthenticated';

export interface AdminAuthData {
  role: string;
}

export interface UseAdminAuthReturn {
  authState: AuthState;
  authData: AdminAuthData | null;
  checkAuth: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isUnauthorized: boolean;
  isUnauthenticated: boolean;
}

export function useAdminAuth(requiredRole: string = 'admin'): UseAdminAuthReturn {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [authData, setAuthData] = useState<AdminAuthData | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      setAuthState('loading');

      // Check if user has required role via server action
      const result = await checkAdminRole(requiredRole);

      if (!result.isAuthenticated) {
        setAuthState('unauthenticated');
        setAuthData(null);
        return;
      }

      if (!result.isAuthorized) {
        setAuthState('unauthorized');
        setAuthData(result.role ? { role: result.role } : null);
        return;
      }

      setAuthState('authenticated');
      setAuthData({ role: result.role || requiredRole });

    } catch {
      setAuthState('unauthenticated');
      setAuthData(null);
    }
  }, [requiredRole]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    authState,
    authData,
    checkAuth,
    isLoading: authState === 'loading',
    isAuthenticated: authState === 'authenticated',
    isUnauthorized: authState === 'unauthorized',
    isUnauthenticated: authState === 'unauthenticated',
  };
}
