'use client';

import { usePathname, router } from 'expo-router';
import { Slot } from 'expo-router';
import { SuitcaseIcon, UserIcon } from '@/components/icons';
import { cn } from '@/lib/utils/cn';

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
        isActive ? 'text-[#FF6B6B]' : 'text-gray-400 hover:text-gray-600'
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
      <main className="flex-1">
        <Slot />
      </main>

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
