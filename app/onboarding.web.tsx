'use client';

import { useState } from 'react';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button.web';
import { Input } from '@/components/ui/Input.web';
import { useUserStore } from '@/lib/stores/userStore';
import { cn } from '@/lib/utils/cn';

function FloatingOrb({
  size,
  color,
  className,
}: {
  size: number;
  color: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'absolute rounded-full opacity-70 animate-bounce',
        className
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        animationDuration: '3s',
      }}
    />
  );
}

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const createUser = useUserStore((state) => state.createUser);

  async function handleContinue() {
    const trimmedName = name.trim();

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

    const user = await createUser(trimmedName);

    if (user) {
      router.replace('/(tabs)');
    } else {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center p-8 overflow-hidden relative">
      {/* Floating decorative orbs */}
      <FloatingOrb size={120} color="#ffc9c9" className="top-16 -left-8" />
      <FloatingOrb size={80} color="#81e6d9" className="top-24 -right-5 animation-delay-500" />
      <FloatingOrb size={50} color="#fef08a" className="top-44 right-20 animation-delay-1000" />
      <FloatingOrb size={40} color="#ffc9c9" className="top-72 left-5 animation-delay-700" />
      <FloatingOrb size={30} color="#81e6d9" className="top-80 right-10 animation-delay-300" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Hero section with icon */}
        <div className="flex flex-col items-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-[#FF6B6B]/20">
            <span className="text-6xl">✈️</span>
          </div>
        </div>

        {/* Title and subtitle */}
        <div className="text-center mb-10 animate-in fade-in duration-500 delay-200">
          <h1 className="text-4xl font-bold text-[#2C3E50] mb-2">
            Welcome to
          </h1>
          <h1 className="text-4xl font-bold text-[#FF6B6B] mb-4">
            TripTogether
          </h1>
          <p className="text-lg text-gray-500 leading-relaxed">
            Plan amazing adventures with your<br />friends and family
          </p>
        </div>

        {/* Input card */}
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <Input
            label="What should we call you?"
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            error={error}
            autoCapitalize="words"
            maxLength={30}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim().length >= 2) {
                handleContinue();
              }
            }}
          />

          <div className="mt-6">
            <Button
              onPress={handleContinue}
              disabled={isLoading || name.trim().length < 2}
              fullWidth
              size="lg"
            >
              {isLoading ? 'Setting up...' : "Let's Go! →"}
            </Button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-gray-400 text-sm mt-6 animate-in fade-in duration-500 delay-500">
          No account needed • Your data syncs automatically
        </p>
      </div>
    </div>
  );
}
