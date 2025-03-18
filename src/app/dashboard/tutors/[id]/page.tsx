'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { StarIcon, ChatBubbleLeftIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  student: {
    id: string;
    name: string;
    image: string | null;
  };
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
  reviews: Review[];
}

export default function TutorProfile({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingDuration, setBookingDuration] = useState('60');
  const [subject, setSubject] = useState('');

  const fetchTutor = useCallback(async () => {
    if (!params.id) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/tutors/${params.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tutor');
      }

      if (!data.tutor) {
        throw new Error('Tutor not found');
      }

      setTutor(data.tutor);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while fetching tutor');
      setTutor(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    
    if (status === 'authenticated') {
      fetchTutor();
    }
  }, [status, router, fetchTutor]);

  const handleBookSession = async () => {
    if (!tutor || !bookingDate || !bookingTime || !subject) {
      setError('Please fill in all booking details');
      return;
    }

    const startTime = new Date(`${bookingDate}T${bookingTime}`);
    const endTime = new Date(startTime.getTime() + parseInt(bookingDuration) * 60000);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tutorId: tutor.id,
          subject,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          price: tutor.profile.hourlyRate * parseInt(bookingDuration) / 60,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/dashboard/sessions');
      } else {
        setError(data.error || 'Failed to book session');
      }
    } catch (error) {
      setError('An error occurred while booking the session');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Loading tutor profile...</p>
        </div>
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Tutor not found</h1>
          <p className="mt-2 text-gray-600">The tutor you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/dashboard/browse')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex items-start space-x-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {tutor.image ? (
                <Image
                  src={tutor.image}
                  alt={tutor.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <AcademicCapIcon className="w-12 h-12" />
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{tutor.name}</h1>
              
              <div className="mt-2 flex items-center">
                {tutor.profile.averageRating && (
                  <div className="flex items-center mr-4">
                    <StarIcon className="w-5 h-5 text-yellow-400" />
                    <span className="ml-1 text-sm font-medium text-gray-600">
                      {tutor.profile.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
                <p className="text-lg font-medium text-gray-900">
                  ${tutor.profile.hourlyRate}/hour
                </p>
              </div>

              <div className="mt-4">
                <h2 className="text-lg font-medium text-gray-900">Subjects</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tutor.profile.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">About</h2>
            <p className="mt-2 text-gray-600">{tutor.profile.bio || 'No bio available'}</p>
          </div>

          {tutor.profile.education && (
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900">Education</h2>
              <p className="mt-2 text-gray-600">{tutor.profile.education}</p>
            </div>
          )}

          {tutor.profile.experience && (
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900">Experience</h2>
              <p className="mt-2 text-gray-600">{tutor.profile.experience}</p>
            </div>
          )}

          <div className="mt-8 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Book a Session</h2>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                <label className="block text-sm font-medium text-gray-700">Duration</label>
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
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleBookSession}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Book Session
              </button>
              <button
                onClick={() => router.push(`/dashboard/messages?userId=${tutor.id}`)}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <ChatBubbleLeftIcon className="w-4 h-4 mr-2" />
                Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
