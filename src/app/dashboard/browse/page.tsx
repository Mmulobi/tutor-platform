'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/providers/SocketProvider';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { StarIcon, ChatBubbleLeftIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

interface TutorProfile {
  bio: string | null;
  education: string | null;
  experience: string | null;
  hourlyRate: number;
  subjects: string;
  averageRating: number | null;
}

interface Tutor {
  id: string;
  name: string;
  image: string | null;
  profile: {
    bio: string | null;
    education: string | null;
    experience: string | null;
    hourlyRate: number;
    subjects: string[];
    averageRating: number | null;
  };
}

export default function BrowseTutors() {
  const { data: session, status } = useSession();
  const { socket } = useSocket();
  const router = useRouter();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingDuration, setBookingDuration] = useState('60');
  const [subject, setSubject] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchTutors();
    }
  }, [status, router]);

  const fetchTutors = async () => {
    try {
      const response = await fetch('/api/tutors');
      const data = await response.json();

      if (response.ok) {
        setTutors(data.tutors);
      } else {
        setError(data.error || 'Failed to fetch tutors');
      }
    } catch (error) {
      setError('An error occurred while fetching tutors');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = async (tutor: Tutor) => {
    if (!bookingDate || !bookingTime || !subject) {
      setError('Please fill in all booking details');
      return;
    }

    const startTime = new Date(`${bookingDate}T${bookingTime}`);
    
    // Validate booking time is in the future
    if (startTime <= new Date()) {
      setError('Please select a future date and time');
      return;
    }

    try {
      // First create the session
      const sessionResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutorId: tutor.id,
          studentId: session?.user?.id,
          scheduledFor: startTime.toISOString(),
          duration: parseInt(bookingDuration),
          subject,
        }),
      });

      const sessionData = await sessionResponse.json();

      if (!sessionResponse.ok) {
        throw new Error(sessionData.error || 'Failed to book session');
      }

      // Create the payment record
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionData.id,
          amount: tutor.profile.hourlyRate * parseInt(bookingDuration) / 60,
          tutorId: tutor.id,
          studentId: session?.user?.id,
        }),
      });

      if (!paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        throw new Error(paymentData.error || 'Failed to process payment');
      }

      // Clear form and selected tutor
      setBookingDate('');
      setBookingTime('');
      setBookingDuration('60');
      setSubject('');
      setSelectedTutor(null);

      // Show success message and redirect to sessions page
      router.push('/dashboard/sessions');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while booking the session');
    }
  };

  const handleMessage = async (tutorId: string) => {
    router.push(`/dashboard/messages?userId=${tutorId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Loading tutors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Tutors</h1>
        <p className="mt-2 text-gray-600">Find and book sessions with our expert tutors</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tutors.map((tutor) => (
          <div
            key={tutor.id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
          >
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                  {tutor.image ? (
                    <Image
                      src={tutor.image}
                      alt={tutor.name}
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
                  <h3 className="text-lg font-semibold text-gray-900">{tutor.name}</h3>
                  <p className="text-sm text-gray-500">
                    {tutor.profile.subjects.join(', ')}
                  </p>
                  {tutor.profile.averageRating && (
                    <div className="flex items-center mt-1">
                      <StarIcon className="w-4 h-4 text-yellow-400" />
                      <span className="ml-1 text-sm text-gray-600">
                        {tutor.profile.averageRating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-600 line-clamp-3">
                  {tutor.profile.bio || 'No bio available'}
                </p>
              </div>

              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900">
                  ${tutor.profile.hourlyRate}/hour
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {selectedTutor?.id === tutor.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time</label>
                      <input
                        type="time"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Duration (minutes)</label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={bookingDuration}
                        onChange={(e) => setBookingDuration(e.target.value)}
                      >
                        <option value="30">30 minutes</option>
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subject</label>
                      <select
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                      >
                        <option value="">Select a subject</option>
                        {tutor.profile.subjects.map((subject) => (
                          <option key={subject} value={subject.trim()}>
                            {subject.trim()}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleBookSession(tutor)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Confirm Booking
                      </button>
                      <button
                        onClick={() => setSelectedTutor(null)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-3">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => router.push(`/dashboard/tutors/${tutor.id}`)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => handleMessage(tutor.id)}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
                        Message
                      </button>
                    </div>
                    <button
                      onClick={() => setSelectedTutor(tutor)}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Book Session
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
