'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

interface Profile {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: 'STUDENT' | 'TUTOR';
  studentProfile?: {
    bio: string | null;
    interests: string | null;
    gradeLevel: string | null;
  } | null;
  tutorProfile?: {
    bio: string | null;
    education: string | null;
    experience: string | null;
    hourlyRate: number;
    subjects: string;
    availability: string | null;
  } | null;
}

export default function ProfileEdit() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [interests, setInterests] = useState('');
  const [gradeLevel, setGradeLevel] = useState('');
  const [availability, setAvailability] = useState('');
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (response.ok) {
        setProfile(data);
        // Initialize form fields
        setName(data.name || '');
        setBio(data.role === 'TUTOR' ? data.tutorProfile?.bio || '' : data.studentProfile?.bio || '');
        setSubjects(data.role === 'TUTOR' ? (data.tutorProfile?.subjects?.split(',').map(s => s.trim()) || []) : []);
        setHourlyRate(data.role === 'TUTOR' ? data.tutorProfile?.hourlyRate?.toString() || '' : '');
        setEducation(data.role === 'TUTOR' ? data.tutorProfile?.education || '' : '');
        setExperience(data.role === 'TUTOR' ? data.tutorProfile?.experience || '' : '');
        setInterests(data.role === 'STUDENT' ? data.studentProfile?.interests || '' : '');
        setGradeLevel(data.role === 'STUDENT' ? data.studentProfile?.gradeLevel || '' : '');
        setAvailability(data.role === 'TUTOR' ? data.tutorProfile?.availability || '' : '');
      } else {
        setError(data.error || 'Failed to fetch profile');
      }
    } catch (error) {
      setError('An error occurred while fetching profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = () => {
    if (newSubject && !subjects.includes(newSubject)) {
      setSubjects([...subjects, newSubject]);
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setSubjects(subjects.filter((s: string) => s !== subject));
  };

  const validateForm = () => {
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }

    if (profile?.role === 'TUTOR') {
      if (!subjects.length) {
        setError('At least one subject is required');
        return false;
      }
      if (!hourlyRate || parseFloat(hourlyRate) <= 0) {
        setError('Please enter a valid hourly rate');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const profileData = {
        name,
        ...(profile?.role === 'TUTOR' ? {
          tutorProfile: {
            bio: bio.trim(),
            subjects: subjects.join(','),
            hourlyRate: parseFloat(hourlyRate),
            education: education.trim(),
            experience: experience.trim(),
            availability: availability.trim(),
          },
        } : {
          studentProfile: {
            bio: bio.trim(),
            interests: interests.trim(),
            gradeLevel: gradeLevel.trim(),
          },
        }),
      };

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError('An error occurred while updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        <p className="mt-2 text-gray-600">Update your profile information</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${!name.trim() ? 'border-red-300' : 'border-gray-300'}`}
                required
                aria-invalid={!name.trim()}
                aria-describedby={!name.trim() ? 'name-error' : undefined}
              />
              {!name.trim() && (
                <p className="mt-1 text-sm text-red-600" id="name-error">
                  Name is required
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            {/* Tutor-specific fields */}
            {profile?.role === 'TUTOR' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subjects</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {subjects.map((subject) => (
                      <span
                        key={subject}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                      >
                        {subject}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubject(subject)}
                          className="ml-2 text-indigo-600 hover:text-indigo-800"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Add a subject"
                      className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubject}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Education</label>
                  <textarea
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Experience</label>
                  <textarea
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Availability</label>
                  <textarea
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                    placeholder="e.g., Weekdays 9 AM - 5 PM, Weekends 10 AM - 2 PM"
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Interests</label>
                  <textarea
                    value={interests}
                    onChange={(e) => setInterests(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Grade Level</label>
                  <input
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
