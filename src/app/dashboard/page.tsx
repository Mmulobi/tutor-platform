'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { BellIcon, CalendarIcon, ChatBubbleLeftIcon, AcademicCapIcon, ChartBarIcon } from '@heroicons/react/24/outline';

// Dynamically import Lottie to avoid SSR issues
const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

// Define types for better type safety
type AnimationData = {
  education: any | null;
  studying: any | null;
  tutoring: any | null;
};

type UserRole = 'STUDENT' | 'TUTOR' | 'ADMIN';

type DashboardCardProps = {
  title: string;
  description: string;
  link: string;
  linkText: string;
  animationType: keyof AnimationData;
  animationData: AnimationData;
  icon?: React.ElementType;
  stats?: {
    value: string | number;
    label: string;
  };
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [animationData, setAnimationData] = useState<AnimationData>({
    education: null,
    studying: null,
    tutoring: null
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      setLoading(false);
    }
  }, [status, router]);

  useEffect(() => {
    const loadAnimationsAsync = async () => {
      try {
        const [educationData, studyingData, tutoringData] = await Promise.all([
          fetch('/animations/lottie/education.json').then(res => res.json()),
          fetch('/animations/lottie/studying.json').then(res => res.json()),
          fetch('/animations/lottie/tutoring.json').then(res => res.json())
        ]);
        
        setAnimationData({
          education: educationData,
          studying: studyingData,
          tutoring: tutoringData
        });
      } catch (error) {
        console.error('Error loading animations:', error);
      }
    };
    
    loadAnimationsAsync();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const userRole = (session?.user?.role as UserRole) || 'STUDENT';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-indigo-50">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
            <div className="flex items-center space-x-3 w-full sm:w-auto justify-center sm:justify-start">
              <div className="w-10 h-10 sm:w-12 sm:h-12 overflow-hidden">
                {animationData.education && (
                  <Lottie 
                    animationData={animationData.education} 
                    loop={true} 
                    autoplay={true} 
                    style={{ width: '100%', height: '100%' }}
                  />
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                {userRole === 'STUDENT' ? 'Student Dashboard' : userRole === 'TUTOR' ? 'Tutor Dashboard' : 'Admin Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4 w-full sm:w-auto justify-center sm:justify-end">
              <button className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors">
                <BellIcon className="w-6 h-6" />
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
              </button>
              <span className="text-gray-700 font-medium hidden sm:inline">
                Welcome, {session?.user?.name || 'User'}
              </span>
              <Link
                href="/auth/signout"
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg overflow-hidden sm:rounded-xl border border-gray-100">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              {userRole === 'STUDENT' ? 'Your Learning Journey' : userRole === 'TUTOR' ? 'Your Teaching Dashboard' : 'Admin Control Panel'}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {userRole === 'STUDENT' 
                ? 'Find tutors, book sessions, and track your progress.' 
                : userRole === 'TUTOR' 
                  ? 'Manage your schedule, sessions, and earnings.' 
                  : 'Manage users, sessions, and platform settings.'}
            </p>
          </div>
          
          {userRole === 'STUDENT' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 p-4 sm:p-6">
              <DashboardCard 
                title="Browse Tutors" 
                description="Find qualified tutors, view their profiles, and book sessions. Filter by subject, rating, and availability."
                link="/dashboard/browse"
                linkText="Find a Tutor"
                animationType="tutoring"
                animationData={animationData}
                icon={AcademicCapIcon}
                stats={{ 
                  value: 'Easy Booking', 
                  label: 'View profiles & book instantly' 
                }}
              />
              <DashboardCard 
                title="My Sessions" 
                description="View your upcoming and past tutoring sessions."
                link="/dashboard/sessions"
                linkText="View Sessions"
                animationType="studying"
                animationData={animationData}
                icon={CalendarIcon}
                stats={{ value: '2', label: 'Upcoming Sessions' }}
              />
              <DashboardCard 
                title="Messages" 
                description="Chat with your tutors and manage your communications."
                link="/dashboard/messages"
                linkText="Open Messages"
                animationType="education"
                animationData={animationData}
                icon={ChatBubbleLeftIcon}
                stats={{ value: '5', label: 'Unread Messages' }}
              />
            </div>
          )}
          
          {userRole === 'TUTOR' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6">
              <DashboardCard 
                title="My Schedule" 
                description="Manage your availability and upcoming sessions."
                link="/dashboard/schedule"
                linkText="View Schedule"
                animationType="studying"
                animationData={animationData}
                icon={CalendarIcon}
                stats={{ value: '8', label: 'Upcoming Sessions' }}
              />
              <DashboardCard 
                title="My Students" 
                description="View and manage your student relationships."
                link="/dashboard/students"
                linkText="View Students"
                animationType="tutoring"
                animationData={animationData}
                icon={AcademicCapIcon}
                stats={{ value: '12', label: 'Active Students' }}
              />
              <DashboardCard 
                title="Earnings" 
                description="Track your earnings and payment history."
                link="/dashboard/earnings"
                linkText="View Earnings"
                animationType="education"
                animationData={animationData}
                icon={ChartBarIcon}
                stats={{ value: '$1,250', label: 'This Month' }}
              />
            </div>
          )}
          
          {userRole === 'ADMIN' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
              <DashboardCard 
                title="User Management" 
                description="Manage students, tutors, and admin accounts."
                link="/admin/users"
                linkText="Manage Users"
                animationType="tutoring"
                animationData={animationData}
              />
              <DashboardCard 
                title="Session Management" 
                description="View and manage all tutoring sessions."
                link="/admin/sessions"
                linkText="Manage Sessions"
                animationType="studying"
                animationData={animationData}
              />
              <DashboardCard 
                title="Platform Analytics" 
                description="View platform usage, earnings, and other metrics."
                link="/admin/analytics"
                linkText="View Analytics"
                animationType="education"
                animationData={animationData}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function DashboardCard({ 
  title, 
  description, 
  link, 
  linkText, 
  animationType, 
  animationData 
}: DashboardCardProps) {
  // Use the animation data passed from the parent component
  // instead of fetching it again
  const animation = animationData[animationType];

  return (
    <div className="bg-white overflow-hidden shadow-lg rounded-xl transition-all duration-300 hover:shadow-xl hover:scale-105 border border-gray-100">
      <div className="px-6 py-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 flex-shrink-0 overflow-hidden">
            {animation && (
              <Lottie 
                animationData={animation} 
                loop={true} 
                autoplay={true} 
                style={{ width: '100%', height: '100%' }}
              />
            )}
          </div>
          <h3 className="text-xl leading-6 font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>{description}</p>
        </div>
        <div className="mt-5">
          <Link
            href={link}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
          >
            {linkText}
          </Link>
        </div>
      </div>
    </div>
  );
}