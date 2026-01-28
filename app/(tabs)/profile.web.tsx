'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button.web';
import { Input } from '@/components/ui/Input.web';
import { Card } from '@/components/ui/Card.web';
import { useUserStore } from '@/lib/stores/userStore';
import { cn } from '@/lib/utils/cn';

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  };

  const colors = [
    'bg-[#FF6B6B]',
    'bg-[#4ECDC4]',
    'bg-[#FFE66D]',
    'bg-[#95E1D3]',
    'bg-[#F38181]',
  ];

  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-bold',
        sizeClasses[size],
        colors[colorIndex]
      )}
    >
      {initials}
    </div>
  );
}

export default function ProfileScreen() {
  const { user, updateDisplayName } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(user?.display_name || '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSaveName() {
    const trimmedName = newName.trim();

    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (trimmedName.length > 30) {
      setError('Name must be less than 30 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    await updateDisplayName(trimmedName);

    setIsLoading(false);
    setIsEditing(false);
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-3xl font-bold text-[#2C3E50]">Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <Card className="p-8 flex flex-col items-center">
            <Avatar name={user?.display_name || 'User'} size="xl" />

            {isEditing ? (
              <div className="w-full mt-6">
                <Input
                  label="Display Name"
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Enter your name"
                  error={error}
                  maxLength={30}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newName.trim().length >= 2) {
                      handleSaveName();
                    }
                    if (e.key === 'Escape') {
                      setIsEditing(false);
                      setNewName(user?.display_name || '');
                      setError('');
                    }
                  }}
                />

                <div className="flex gap-3 mt-4">
                  <Button
                    onPress={() => {
                      setIsEditing(false);
                      setNewName(user?.display_name || '');
                      setError('');
                    }}
                    variant="ghost"
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button
                    onPress={handleSaveName}
                    disabled={isLoading || newName.trim().length < 2}
                    fullWidth
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-[#2C3E50] mt-4">
                  {user?.display_name}
                </h2>

                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 mt-2 text-gray-500 hover:text-[#4ECDC4] transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit name
                </button>
              </>
            )}
          </Card>
        </div>

        {/* Stats Section */}
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">Quick Stats</h3>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 flex flex-col items-center">
              <span className="text-3xl font-bold text-[#FF6B6B]">0</span>
              <span className="text-gray-500 mt-1">Trips</span>
            </Card>

            <Card className="p-6 flex flex-col items-center">
              <span className="text-3xl font-bold text-[#4ECDC4]">0</span>
              <span className="text-gray-500 mt-1">Places</span>
            </Card>
          </div>
        </div>

        {/* App Info */}
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <Card className="divide-y divide-gray-100">
            <div className="flex items-center justify-between py-4 px-2">
              <span className="text-[#2C3E50]">App Version</span>
              <span className="text-gray-500">1.0.0</span>
            </div>

            <button className="flex items-center justify-between py-4 px-2 w-full hover:bg-gray-50 transition-colors rounded-lg">
              <span className="text-[#2C3E50]">Privacy Policy</span>
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            </button>

            <button className="flex items-center justify-between py-4 px-2 w-full hover:bg-gray-50 transition-colors rounded-lg">
              <span className="text-[#2C3E50]">Terms of Service</span>
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            </button>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center animate-in fade-in duration-500 delay-500">
          <p className="text-gray-400 text-sm">
            Made with ❤️ for travelers
          </p>
        </div>
      </div>
    </div>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
