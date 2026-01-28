'use client';

import { usePathname, router } from 'expo-router';
import { Slot } from 'expo-router';
import { cn } from '@/lib/utils/cn';

function SuitcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

interface TabButtonProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function TabButton({ href, icon, label, isActive }: TabButtonProps) {
  return (
    <button
      onClick={() => router.push(href)}
      className={cn(
        'flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all duration-200',
        isActive
          ? 'text-[#FF6B6B]'
          : 'text-gray-400 hover:text-gray-600'
      )}
    >
      <div
        className={cn(
          'p-2 rounded-xl transition-all duration-200',
          isActive ? 'bg-[#fff5f5]' : 'bg-transparent'
        )}
      >
        {icon}
      </div>
      <span className={cn('text-xs font-semibold', isActive && 'text-[#FF6B6B]')}>
        {label}
      </span>
    </button>
  );
}

export default function TabLayout() {
  const pathname = usePathname();

  const isTripsActive = pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/';
  const isProfileActive = pathname === '/profile' || pathname === '/(tabs)/profile';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content */}
      <main className="flex-1">
        <Slot />
      </main>

      {/* Bottom Tab Bar */}
      <nav className="sticky bottom-0 bg-white border-t border-gray-100 shadow-lg shadow-black/5">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-center gap-8 py-2">
            <TabButton
              href="/(tabs)"
              icon={<SuitcaseIcon className="w-6 h-6" />}
              label="My Trips"
              isActive={isTripsActive}
            />
            <TabButton
              href="/(tabs)/profile"
              icon={<UserIcon className="w-6 h-6" />}
              label="Profile"
              isActive={isProfileActive}
            />
          </div>
        </div>
      </nav>
    </div>
  );
}
