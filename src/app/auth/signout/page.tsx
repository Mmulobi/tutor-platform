'use client';

import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

export default function SignOut() {
  const [isSigningOut, setIsSigningOut] = useState(true);

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await signOut({ redirect: false });
        setIsSigningOut(false);
      } catch (error) {
        console.error('Error signing out:', error);
        setIsSigningOut(false);
      }
    };

    handleSignOut();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isSigningOut ? 'Signing out...' : 'You have been signed out'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isSigningOut 
              ? 'Please wait while we sign you out.' 
              : 'Thank you for using TutorConnect. We hope to see you again soon!'}
          </p>
        </div>
        
        {!isSigningOut && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-center">
              <Link
                href="/"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Return to Home
              </Link>
            </div>
            <div className="text-center">
              <Link
                href="/auth/signin"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Sign in again
              </Link>
            </div>
          </div>
        )}
        
        {isSigningOut && (
          <div className="mt-8 flex justify-center">
            <div className="w-12 h-12 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </div>
  );
}
