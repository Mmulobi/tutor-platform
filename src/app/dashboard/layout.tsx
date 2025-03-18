'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import Image from 'next/image';
import { UserIcon, AcademicCapIcon, CalendarIcon, ChatBubbleLeftRightIcon, UsersIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface NavItem {
  name: string;
  href: string;
  icon: typeof UserIcon;
  roles?: string[];
}

const navigation: NavItem[] = [
  { name: 'Overview', href: '/dashboard', icon: UserIcon },
  { name: 'Browse', href: '/dashboard/browse', icon: AcademicCapIcon, roles: ['STUDENT'] },
  { name: 'Students', href: '/dashboard/students', icon: UsersIcon, roles: ['TUTOR'] },
  { name: 'Sessions', href: '/dashboard/sessions', icon: CalendarIcon },
  { name: 'Messages', href: '/dashboard/messages', icon: ChatBubbleLeftRightIcon },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const filteredNavigation = navigation.filter(item => 
    !item.roles || (session?.user?.role && item.roles.includes(session.user.role))
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-xl font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-600 pb-32">
        <nav className="border-b border-indigo-500 border-opacity-25 bg-indigo-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-16 flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <h1 className="text-white text-xl font-bold">Tutor Platform</h1>
                </div>
                <div className="hidden md:block">
                  <div className="ml-10 flex items-baseline space-x-4">
                    {filteredNavigation.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <button
                          key={item.name}
                          onClick={() => router.push(item.href)}
                          className={`${isActive
                            ? 'bg-indigo-700 text-white'
                            : 'text-white hover:bg-indigo-500 hover:bg-opacity-75'
                            } px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2`}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/dashboard/profile')}
                  className="text-white hover:bg-indigo-500 hover:bg-opacity-75 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                  <span>Edit Profile</span>
                </button>
                <div className="flex items-center">
                  {session?.user?.image ? (
                    <div className="h-8 w-8 rounded-full overflow-hidden">
                      <Image
                        src={session.user.image}
                        alt={session.user.name || ''}
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-indigo-700 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {session?.user?.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                  <span className="ml-3 text-white text-sm font-medium">
                    {session?.user?.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>

      <main className="-mt-32">
        <div className="max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
