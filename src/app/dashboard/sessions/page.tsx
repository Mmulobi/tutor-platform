'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { CalendarIcon, ClockIcon, VideoCameraIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { useSocket } from '@/providers/SocketProvider';

type Tutor = {
  id: string;
  name: string;
  image: string | null;
  tutorProfile: {
    subjects: string[];
    hourlyRate: number;
    averageRating: number;
  };
};

type Review = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type Payment = {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
};

type Session = {
  id: string;
  scheduledFor: string;
  duration: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  subject: string;
  meetingLink?: string;
  tutor: Tutor;
  student: {
    id: string;
    name: string;
    image: string | null;
    email: string;
  };
};

type GroupedSessions = {
  upcoming: Session[];
  completed: Session[];
  cancelled: Session[];
};

export default function SessionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<GroupedSessions>({
    upcoming: [],
    completed: [],
    cancelled: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<keyof GroupedSessions>('upcoming');
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const { socket } = useSocket();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/sessions');
        const data = await response.json();

        if (response.ok) {
          // Group sessions by status
          const grouped = data.sessions.reduce((acc: GroupedSessions, session: Session) => {
            const sessionDate = new Date(session.scheduledFor);
            const now = new Date();

            if (session.status === 'CANCELLED') {
              acc.cancelled.push(session);
            } else if (session.status === 'COMPLETED' || sessionDate < now) {
              acc.completed.push(session);
            } else {
              acc.upcoming.push(session);
            }
            return acc;
          }, {
            upcoming: [],
            completed: [],
            cancelled: [],
          });

          setSessions(grouped);
        } else {
          setError(data.error || 'Failed to fetch sessions');
          console.error('Error fetching sessions:', data.error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchSessions();
    }
  }, [status]);

  // Handle real-time session updates
  useEffect(() => {
    if (!socket) return;

    const handleSessionBooked = (newSession: Session) => {
      setSessions(prev => {
        const updated = { ...prev };
        updated.upcoming = [...prev.upcoming, newSession];
        return updated;
      });
    };

    const handleSessionUpdated = (updatedSession: Session) => {
      setSessions(prev => {
        const updated = { ...prev };
        // Remove from all categories first
        Object.keys(updated).forEach(key => {
          updated[key as keyof GroupedSessions] = updated[key as keyof GroupedSessions].filter(
            s => s.id !== updatedSession.id
          );
        });

        // Add to appropriate category
        const sessionDate = new Date(updatedSession.scheduledFor);
        const now = new Date();

        if (updatedSession.status === 'CANCELLED') {
          updated.cancelled.push(updatedSession);
        } else if (updatedSession.status === 'COMPLETED' || sessionDate < now) {
          updated.completed.push(updatedSession);
        } else {
          updated.upcoming.push(updatedSession);
        }

        return updated;
      });
    };

    socket.on('session-booked', handleSessionBooked);
    socket.on('session-updated', handleSessionUpdated);

    return () => {
      socket.off('session-booked', handleSessionBooked);
      socket.off('session-updated', handleSessionUpdated);
    };
  }, [socket]);



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Loading your sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {Object.entries(sessions).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as keyof GroupedSessions)}
                  className={`
                    py-4 px-6 text-center border-b-2 font-medium text-sm
                    ${activeTab === key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full">
                    {value.length}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Session Cards */}
          <div className="p-6">
            <div className="space-y-6">
              {sessions[activeTab].map((session) => (
                <div key={session.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                          {session.tutor.image ? (
                            <Image
                              src={session.tutor.image}
                              alt={session.tutor.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <VideoCameraIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{session.tutor.name}</h3>
                          <p className="text-sm text-gray-500">{session.subject}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          <CalendarIcon className="inline-block w-4 h-4 mr-1" />
                          {format(new Date(session.scheduledFor), 'MMM d, yyyy')}
                        </div>
                        <div className="text-sm text-gray-500">
                          <ClockIcon className="inline-block w-4 h-4 mr-1" />
                          {format(new Date(session.scheduledFor), 'h:mm a')} ({session.duration} minutes)
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className={`
                          px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${session.status === 'SCHEDULED' ? 'bg-green-100 text-green-800' :
                            session.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'}
                        `}>
                          {session.status.toLowerCase()}
                        </span>
                      </div>

                      <div className="space-x-3">
                        {session.status === 'SCHEDULED' && session.meetingLink && (
                          <a
                            href={session.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            <VideoCameraIcon className="w-4 h-4 mr-1" />
                            Join Meeting
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {sessions[activeTab].length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No {activeTab} sessions found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
