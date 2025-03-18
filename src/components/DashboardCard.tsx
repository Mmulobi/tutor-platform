import Link from 'next/link';
import type { ComponentType } from 'react';

interface DashboardCardProps {
  title: string;
  description: string;
  link: string;
  linkText: string;
  animationType?: string;
  icon: ComponentType<{ className?: string }>;
  stats: {
    value: string;
    label: string;
  };
}

export default function DashboardCard({
  title,
  description,
  link,
  linkText,
  animationType = 'default',
  icon: Icon,
  stats,
}: DashboardCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{stats.label}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{stats.value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-5 py-3">
        <div className="text-sm">
          <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
          <p className="text-gray-500 mb-3">{description}</p>
          <Link
            href={link}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {linkText}
          </Link>
        </div>
      </div>
    </div>
  );
}
