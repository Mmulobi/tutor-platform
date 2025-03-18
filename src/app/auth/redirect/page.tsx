'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const redirectUser = async () => {
      if (status === 'loading') return;

      if (status === 'unauthenticated') {
        router.replace('/auth/signin');
        return;
      }

      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();

        if (data.error) {
          console.error('Error fetching user data:', data.error);
          router.replace('/auth/signin');
          return;
        }

        // Force a hard redirect based on role
        if (data.role === 'TUTOR') {
          window.location.href = '/dashboard/tutor';
        } else if (data.role === 'STUDENT') {
          window.location.href = '/dashboard/student';
        } else {
          window.location.href = '/dashboard';
        }
      } catch (error) {
        console.error('Error during redirect:', error);
        router.replace('/auth/signin');
      }
    };

    redirectUser();
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-xl font-semibold">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
