'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, ChatBubbleLeftIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid';
import DashboardCard from '@/components/DashboardCard';

export default function TutorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session?.user?.role !== 'TUTOR') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tutor Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {session?.user?.name}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
          <DashboardCard 
            title="My Sessions" 
            description="View and manage your upcoming tutoring sessions."
            link="/dashboard/sessions"
            linkText="View Sessions"
            animationType="teaching"
            icon={CalendarIcon}
            stats={{ value: '3', label: 'Upcoming Sessions' }}
          />
          <DashboardCard 
            title="Messages" 
            description="Chat with your students and manage communications."
            link="/dashboard/messages"
            linkText="Open Messages"
            animationType="communication"
            icon={ChatBubbleLeftIcon}
            stats={{ value: '2', label: 'Unread Messages' }}
          />
          <DashboardCard 
            title="Earnings" 
            description="Track your earnings and payment history."
            link="/dashboard/earnings"
            linkText="View Earnings"
            animationType="finance"
            icon={CurrencyDollarIcon}
            stats={{ value: '$150', label: 'This Month' }}
          />
        </div>
      </div>
    </div>
  );
}
