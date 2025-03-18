'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AcademicCapIcon, ChatBubbleLeftIcon, StarIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface Student {
  id: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: string;
  bookings?: {
    id: string;
    subject: string;
    startTime: string;
    endTime: string;
    status: string;
  }[];
}

export default function Students() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/students');
        const data = await response.json();

        if (response.ok) {
          setStudents(data.students);
          setLoading(false);
        } else {
          setError(data.error || 'Failed to fetch students');
          setLoading(false);
          console.error('Error fetching students:', data.error);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
        setLoading(false);
        console.error('Error fetching students:', error);
      }
    };

    if (status === 'authenticated') {
      fetchStudents();
    }
  }, [status]);

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
          <p className="mt-4 text-xl font-semibold">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
        <p className="mt-2 text-gray-600">Manage your student relationships and track their progress</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {students.map((student) => (
          <div
            key={student.id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                  {student.image ? (
                    <Image
                      src={student.image}
                      alt={student.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <AcademicCapIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
                  <p className="text-sm text-gray-500">{student.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Joined {new Date(student.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {student.bookings && student.bookings.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Sessions</h4>
                  <div className="space-y-3">
                    {student.bookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-gray-50 rounded-md p-3 text-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{booking.subject}</p>
                            <p className="text-gray-500 mt-1">
                              {new Date(booking.startTime).toLocaleDateString()}{' '}
                              {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className={`
                            px-2 py-1 rounded-full text-xs font-medium
                            ${booking.status === 'SCHEDULED' ? 'bg-green-100 text-green-800' :
                              booking.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'}
                          `}>
                            {booking.status.toLowerCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end space-x-3">
                <button 
                  onClick={() => router.push(`/dashboard/messages?userId=${student.id}`)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
                >
                  <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
                  Message
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
