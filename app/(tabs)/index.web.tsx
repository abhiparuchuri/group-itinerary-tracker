'use client';

import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button.web';
import { Input } from '@/components/ui/Input.web';
import { Card } from '@/components/ui/Card.web';
import { useUserStore } from '@/lib/stores/userStore';
import { useTripStore } from '@/lib/stores/tripStore';
import { cn } from '@/lib/utils/cn';

function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export default function TripsScreen() {
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [tripName, setTripName] = useState('');
  const [error, setError] = useState('');

  const user = useUserStore((state) => state.user);
  const { trips, isLoading, fetchTrips, createTrip, joinTripByCode } = useTripStore();

  useEffect(() => {
    if (user?.id) {
      fetchTrips(user.id);
    }
  }, [user?.id]);

  async function handleCreateTrip() {
    if (!user?.id || !tripName.trim()) return;

    setError('');
    const trip = await createTrip(tripName.trim(), user.id);

    if (trip) {
      setTripName('');
      setShowCreateModal(false);
      router.push(`/trip/${trip.id}`);
    } else {
      setError('Failed to create trip. Please try again.');
    }
  }

  async function handleJoinTrip() {
    if (!user?.id || !joinCode.trim()) return;

    setError('');
    const result = await joinTripByCode(joinCode, user.id);

    if (result.success) {
      setJoinCode('');
      setShowJoinModal(false);
    } else {
      setError(result.error || 'Failed to join trip');
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <p className="text-gray-500 text-base font-medium">
            {getGreeting()}{user?.display_name ? `, ${user.display_name}` : ''}
          </p>
          <h1 className="text-3xl font-bold text-[#2C3E50] mt-1">Your Trips</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <Button
            onPress={() => setShowCreateModal(true)}
            variant="primary"
            fullWidth
            icon={<PlusIcon />}
          >
            New Trip
          </Button>
          <Button
            onPress={() => setShowJoinModal(true)}
            variant="secondary"
            fullWidth
            icon={<UsersIcon />}
          >
            Join Trip
          </Button>
        </div>

        {/* Trips List */}
        {trips.length === 0 ? (
          <div className="flex flex-col items-center py-20 px-8 animate-in fade-in duration-500 delay-200">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-lg">
              <span className="text-5xl">🗺️</span>
            </div>
            <h2 className="text-2xl font-bold text-[#2C3E50] mb-3">No trips yet</h2>
            <p className="text-gray-500 text-center text-base leading-relaxed">
              Start your adventure! Create a new trip<br />or join one with a friend's code.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((item, index) => (
              <div
                key={item.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${100 + index * 50}ms` }}
              >
                <Card
                  onPress={() => router.push(`/trip/${item.id}`)}
                  className="hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-3">
                      <h3 className="text-xl font-bold text-[#2C3E50]">{item.name}</h3>
                      {(item.start_date || item.end_date) && (
                        <div className="flex items-center mt-2 text-gray-500 text-sm">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {formatDate(item.start_date)}
                          {item.end_date && ` → ${formatDate(item.end_date)}`}
                        </div>
                      )}
                      <div className="flex items-center mt-2 text-gray-500 text-sm">
                        <UsersIcon className="w-4 h-4 mr-2" />
                        {item.memberCount} {item.memberCount === 1 ? 'traveler' : 'travelers'}
                      </div>
                    </div>
                    <div className="bg-[#e6fffa] px-3 py-1.5 rounded-xl">
                      <span className="text-[#319795] font-bold text-xs tracking-wider">{item.join_code}</span>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Trip Modal */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setTripName(''); setError(''); }}>
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-[#fff5f5] rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">✈️</span>
            </div>
            <h2 className="text-2xl font-bold text-[#2C3E50]">Create New Trip</h2>
            <p className="text-gray-500 text-center mt-1">
              Give your adventure a name
            </p>
          </div>

          <Input
            label="Trip Name"
            value={tripName}
            onChangeText={setTripName}
            placeholder="e.g., Summer in Italy"
            error={error}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && tripName.trim()) {
                handleCreateTrip();
              }
            }}
          />

          <div className="flex gap-3 mt-6">
            <Button
              onPress={() => { setShowCreateModal(false); setTripName(''); setError(''); }}
              variant="ghost"
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onPress={handleCreateTrip}
              disabled={!tripName.trim() || isLoading}
              fullWidth
            >
              {isLoading ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Join Trip Modal */}
      <Modal isOpen={showJoinModal} onClose={() => { setShowJoinModal(false); setJoinCode(''); setError(''); }}>
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-[#e6fffa] rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">🤝</span>
            </div>
            <h2 className="text-2xl font-bold text-[#2C3E50]">Join a Trip</h2>
            <p className="text-gray-500 text-center mt-1">
              Enter the code from your friend
            </p>
          </div>

          <Input
            label="Trip Code"
            value={joinCode}
            onChangeText={(text) => setJoinCode(text.toUpperCase())}
            placeholder="e.g., ABC123"
            error={error}
            maxLength={6}
            style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && joinCode.length === 6) {
                handleJoinTrip();
              }
            }}
          />

          <div className="flex gap-3 mt-6">
            <Button
              onPress={() => { setShowJoinModal(false); setJoinCode(''); setError(''); }}
              variant="ghost"
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onPress={handleJoinTrip}
              disabled={joinCode.length !== 6 || isLoading}
              variant="secondary"
              fullWidth
            >
              {isLoading ? 'Joining...' : 'Join'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Simple icon components
function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
