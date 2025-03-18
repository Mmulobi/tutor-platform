'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CalendarIcon, ClockIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { BookingStatus } from '@prisma/client';

type Session = {
  id: string;
  subject: string;
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
  isGroupSession: boolean;
  price: number;
  notes?: string | null;
  meetingLink?: string | null;
  student: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  payment?: {
    status: string;
  } | null;
};

export default function Schedule() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [sessions, setSessions] = useState<Session[]>([

  ]);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/bookings/tutor');
      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      setLoading(false);
      fetchSessions();

      // Set up polling for real-time updates
      const pollInterval = setInterval(fetchSessions, 30000); // Poll every 30 seconds
      return () => clearInterval(pollInterval);
    }
  }, [status, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
        <p className="mt-2 text-gray-600">Manage your tutoring sessions and availability</p>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Upcoming Sessions</h2>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300">
              Set Availability
            </button>
          </div>

          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900">{session.subject} with {session.student.name}</h3>
                      {session.isGroupSession && (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Group</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{session.student.email}</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center text-gray-600">
                        <CalendarIcon className="w-5 h-5 mr-2" />
                        <span>{new Date(session.startTime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <ClockIcon className="w-5 h-5 mr-2" />
                        <span>
                          {new Date(session.startTime).toLocaleTimeString()} - {new Date(session.endTime).toLocaleTimeString()}
                          ({Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60))} mins)
                        </span>
                      </div>
                      {session.meetingLink && (
                        <div className="flex items-center text-gray-600">
                          <VideoCameraIcon className="w-5 h-5 mr-2" />
                          <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" 
                             className="text-indigo-600 hover:text-indigo-800">Join Meeting</a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        session.status === 'CONFIRMED'
                          ? 'bg-green-100 text-green-800'
                          : session.status === 'COMPLETED'
                          ? 'bg-gray-100 text-gray-800'
                          : session.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.status.charAt(0) + session.status.slice(1).toLowerCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">${session.price}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex space-x-3">
                  {session.status === 'PENDING' && (
                    <button 
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300"
                      onClick={() => {/* Add confirm handler */}}
                    >
                      Confirm
                    </button>
                  )}
                  {(session.status === 'PENDING' || session.status === 'CONFIRMED') && (
                    <button 
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300"
                      onClick={() => {/* Add cancel handler */}}
                    >
                      Cancel
                    </button>
                  )}
                  {session.status === 'CONFIRMED' && !session.meetingLink && (
                    <button 
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
                      onClick={() => {/* Add create meeting handler */}}
                    >
                      Create Meeting
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
