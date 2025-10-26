// modules/admin/shared/ui/AdminAuthWrapper.tsx
// PORTED FROM CERTISTRY-APP - FULL CODE (adapted for CertistryLMS auth)
"use client";

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/modules/admin/shared/hooks/useAdminAuth';

interface AdminAuthWrapperProps {
  children: ReactNode;
  requiredRole?: 'admin';
}

export function AdminAuthWrapper({
  children,
  requiredRole = 'admin'
}: AdminAuthWrapperProps) {
  const router = useRouter();
  const { authState, isLoading, isAuthenticated, isUnauthorized, isUnauthenticated } = useAdminAuth(requiredRole);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Verifying Access...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we check your permissions.
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (isUnauthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-md text-center">
          <div className="mb-4 mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Authentication Required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to access the admin panel.
          </p>
          <Button onClick={() => signIn('cognito')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Unauthorized state (logged in but wrong role)
  if (isUnauthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-md text-center">
          <div className="mb-4 mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-semibold mb-2">Admin Access Required</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This page is restricted to administrators only. Please contact your system administrator if you believe you should have access.
          </p>
          <div className="space-x-3">
            <Button
              onClick={() => router.push('/portal')}
              variant="default"
            >
              Go to Portal
            </Button>
            <Button
              onClick={() => signIn('cognito')}
              variant="outline"
            >
              Switch Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated state - render children
  return <>{children}</>;
}
