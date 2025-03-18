'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CurrencyDollarIcon, ChartBarIcon, ArrowTrendingUpIcon, ClockIcon } from '@heroicons/react/24/outline';

type EarningPeriod = {
  id: string;
  period: string;
  amount: number;
  sessions: number;
  avgRating: number;
  status: 'paid' | 'pending';
};

type RecentSession = {
  id: string;
  studentName: string;
  subject: string;
  date: string;
  duration: string;
  amount: number;
};

export default function Earnings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API calls
  const [earnings] = useState<EarningPeriod[]>([
    {
      id: '1',
      period: 'March 2025',
      amount: 1250,
      sessions: 25,
      avgRating: 4.8,
      status: 'pending'
    },
    {
      id: '2',
      period: 'February 2025',
      amount: 1100,
      sessions: 22,
      avgRating: 4.7,
      status: 'paid'
    },
    {
      id: '3',
      period: 'January 2025',
      amount: 950,
      sessions: 19,
      avgRating: 4.9,
      status: 'paid'
    }
  ]);

  const [recentSessions] = useState<RecentSession[]>([
    {
      id: '1',
      studentName: 'John Doe',
      subject: 'Mathematics',
      date: '2025-03-17',
      duration: '1 hour',
      amount: 50
    },
    {
      id: '2',
      studentName: 'Jane Smith',
      subject: 'Physics',
      date: '2025-03-16',
      duration: '1.5 hours',
      amount: 75
    },
    {
      id: '3',
      studentName: 'Mike Johnson',
      subject: 'Chemistry',
      date: '2025-03-15',
      duration: '1 hour',
      amount: 50
    }
  ]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Loading earnings...</p>
        </div>
      </div>
    );
  }

  const totalEarnings = earnings.reduce((sum, period) => sum + period.amount, 0);
  const totalSessions = earnings.reduce((sum, period) => sum + period.sessions, 0);
  const avgRating = earnings.reduce((sum, period) => sum + period.avgRating, 0) / earnings.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Earnings</h1>
        <p className="mt-2 text-gray-600">Track your earnings and payment history</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <CurrencyDollarIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Earnings</p>
              <p className="text-2xl font-semibold text-gray-900">${totalEarnings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Sessions</p>
              <p className="text-2xl font-semibold text-gray-900">{totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ArrowTrendingUpIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Rating</p>
              <p className="text-2xl font-semibold text-gray-900">{avgRating.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Monthly Earnings</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {earnings.map((period) => (
                <div key={period.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{period.period}</p>
                    <p className="text-sm text-gray-500">{period.sessions} sessions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${period.amount}</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        period.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {period.status.charAt(0).toUpperCase() + period.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{session.studentName}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {session.duration} - {session.subject}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${session.amount}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(session.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
