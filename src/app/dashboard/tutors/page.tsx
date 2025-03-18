'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TutorsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to browse page if someone tries to access /dashboard/tutors directly
    router.replace('/dashboard/browse');
  }, [router]);

  return null;
}
