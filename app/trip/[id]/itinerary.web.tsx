'use client';

import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Button } from '@/components/ui/Button.web';
import { Input } from '@/components/ui/Input.web';
import { Card } from '@/components/ui/Card.web';
import { useItineraryStore } from '@/lib/stores/itineraryStore';
import { useUserStore } from '@/lib/stores/userStore';
import { Activity, ActivityCategory } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

const CATEGORY_CONFIG: Record<ActivityCategory, { icon: React.ReactNode; color: string; bg: string }> = {
  food: { icon: <ForkKnifeIcon className="w-5 h-5" />, color: '#FF6B6B', bg: 'bg-[#fff5f5]' },
  attraction: { icon: <StarIcon className="w-5 h-5" />, color: '#4ECDC4', bg: 'bg-[#e6fffa]' },
  transport: { icon: <CarIcon className="w-5 h-5" />, color: '#9B59B6', bg: 'bg-purple-100' },
  lodging: { icon: <BedIcon className="w-5 h-5" />, color: '#3498DB', bg: 'bg-blue-100' },
  other: { icon: <MapPinIcon className="w-5 h-5" />, color: '#95A5A6', bg: 'bg-gray-100' },
};

function formatDate(dateString: string) {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(timeString: string | null) {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

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

export default function ItineraryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useUserStore((state) => state.user);
  const { days, isLoading, fetchItinerary, addDay, addActivity, deleteDay, deleteActivity } =
    useItineraryStore();

  const [showAddDay, setShowAddDay] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [showAddActivity, setShowAddActivity] = useState<string | null>(null);
  const [newActivityName, setNewActivityName] = useState('');
  const [newActivityCategory, setNewActivityCategory] = useState<ActivityCategory>('other');

  useEffect(() => {
    if (id) {
      fetchItinerary(id);
    }
  }, [id]);

  async function handleAddDay() {
    if (!id || !newDate) return;

    await addDay(id, newDate);
    setNewDate('');
    setShowAddDay(false);
  }

  async function handleAddActivity(dayId: string) {
    if (!user?.id || !newActivityName.trim()) return;

    await addActivity(
      dayId,
      {
        name: newActivityName.trim(),
        category: newActivityCategory,
      },
      user.id
    );

    setNewActivityName('');
    setNewActivityCategory('other');
    setShowAddActivity(null);
  }

  function handleDeleteDay(dayId: string, date: string) {
    if (confirm(`Are you sure you want to delete ${formatDate(date)} and all its activities?`)) {
      deleteDay(dayId);
    }
  }

  function handleDeleteActivity(activityId: string, name: string) {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteActivity(activityId);
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF9F0]">
      {/* Back button */}
      <div className="sticky top-0 bg-[#FFF9F0]/80 backdrop-blur-sm z-10 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-[#2C3E50] transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-3xl font-bold text-[#2C3E50]">Itinerary</h1>
          <Button
            onPress={() => setShowAddDay(true)}
            size="sm"
            icon={<PlusIcon className="w-4 h-4" />}
          >
            Add Day
          </Button>
        </div>

        {/* Days List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B6B]"></div>
          </div>
        ) : days.length === 0 ? (
          <div className="flex flex-col items-center py-16 animate-in fade-in duration-500">
            <span className="text-6xl mb-4">📅</span>
            <h2 className="text-xl font-semibold text-[#2C3E50] mb-2">No days planned</h2>
            <p className="text-gray-500 text-center">
              Add your first day to start<br />planning your adventure!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {days.map((day, dayIndex) => (
              <div
                key={day.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${dayIndex * 100}ms` }}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="bg-[#FF6B6B] w-10 h-10 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-bold">{dayIndex + 1}</span>
                    </div>
                    <span className="text-lg font-semibold text-[#2C3E50]">
                      {formatDate(day.date)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddActivity(day.id)}
                      className="bg-[#e6fffa] p-2 rounded-full hover:bg-[#b2f5ea] transition-colors"
                    >
                      <PlusIcon className="w-4 h-4 text-[#4ECDC4]" />
                    </button>
                    <button
                      onClick={() => handleDeleteDay(day.id, day.date)}
                      className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Activities */}
                <Card className="divide-y divide-gray-100">
                  {day.activities.length === 0 ? (
                    <button
                      onClick={() => setShowAddActivity(day.id)}
                      className="py-4 w-full text-center text-gray-400 hover:text-[#4ECDC4] transition-colors"
                    >
                      No activities yet. Click + to add one!
                    </button>
                  ) : (
                    day.activities.map((activity) => (
                      <ActivityItem
                        key={activity.id}
                        activity={activity}
                        onDelete={() => handleDeleteActivity(activity.id, activity.name)}
                      />
                    ))
                  )}
                </Card>

                {/* Inline Add Activity Form */}
                {showAddActivity === day.id && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Card className="p-4">
                      <Input
                        label="Activity Name"
                        value={newActivityName}
                        onChangeText={setNewActivityName}
                        placeholder="e.g., Visit Eiffel Tower"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newActivityName.trim()) {
                            handleAddActivity(day.id);
                          }
                          if (e.key === 'Escape') {
                            setShowAddActivity(null);
                            setNewActivityName('');
                          }
                        }}
                      />

                      <div className="mt-4">
                        <label className="block text-[#2C3E50] font-bold mb-3 text-base">Category</label>
                        <div className="flex flex-wrap gap-2">
                          {(Object.keys(CATEGORY_CONFIG) as ActivityCategory[]).map((cat) => (
                            <button
                              key={cat}
                              onClick={() => setNewActivityCategory(cat)}
                              className={cn(
                                'flex items-center px-3 py-2 rounded-full border-2 transition-colors',
                                newActivityCategory === cat
                                  ? 'border-[#FF6B6B] bg-[#fff5f5]'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              )}
                            >
                              <span style={{ color: CATEGORY_CONFIG[cat].color }}>
                                {CATEGORY_CONFIG[cat].icon}
                              </span>
                              <span
                                className={cn(
                                  'ml-2 capitalize',
                                  newActivityCategory === cat ? 'text-[#FF6B6B]' : 'text-gray-600'
                                )}
                              >
                                {cat}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <Button
                          onPress={() => {
                            setShowAddActivity(null);
                            setNewActivityName('');
                          }}
                          variant="ghost"
                          fullWidth
                        >
                          Cancel
                        </Button>
                        <Button
                          onPress={() => handleAddActivity(day.id)}
                          disabled={!newActivityName.trim()}
                          fullWidth
                        >
                          Add
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Day Modal */}
      <Modal isOpen={showAddDay} onClose={() => setShowAddDay(false)}>
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-[#e6fffa] rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">📅</span>
            </div>
            <h2 className="text-2xl font-bold text-[#2C3E50]">Add a Day</h2>
          </div>

          <div className="mb-6">
            <label className="block text-[#2C3E50] font-bold mb-3 text-base">Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full h-14 rounded-2xl border-2 border-gray-200 bg-gray-50 px-5 text-lg font-medium text-[#2C3E50] transition-all duration-200 focus:outline-none focus:border-[#4ECDC4] focus:bg-white focus:shadow-lg focus:shadow-[#4ECDC4]/10"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onPress={() => {
                setShowAddDay(false);
                setNewDate('');
              }}
              variant="ghost"
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onPress={handleAddDay}
              disabled={!newDate}
              fullWidth
            >
              Add Day
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ActivityItem({
  activity,
  onDelete,
}: {
  activity: Activity;
  onDelete: () => void;
}) {
  const config = CATEGORY_CONFIG[activity.category];

  return (
    <div className="flex items-start py-3 first:pt-0 last:pb-0">
      <div className={cn('p-2 rounded-xl mr-3', config.bg)}>
        <span style={{ color: config.color }}>{config.icon}</span>
      </div>

      <div className="flex-1">
        <p className="text-[#2C3E50] font-semibold">{activity.name}</p>

        {activity.location_name && (
          <div className="flex items-center mt-1">
            <MapPinIcon className="w-3 h-3 text-gray-400" />
            <span className="text-gray-500 text-sm ml-1">{activity.location_name}</span>
          </div>
        )}

        {(activity.start_time || activity.end_time) && (
          <div className="flex items-center mt-1">
            <ClockIcon className="w-3 h-3 text-gray-400" />
            <span className="text-gray-500 text-sm ml-1">
              {formatTime(activity.start_time)}
              {activity.end_time && ` - ${formatTime(activity.end_time)}`}
            </span>
          </div>
        )}

        {activity.description && (
          <p className="text-gray-600 text-sm mt-1">{activity.description}</p>
        )}
      </div>

      <button
        onClick={onDelete}
        className="p-2 text-gray-400 hover:text-[#FF6B6B] transition-colors"
      >
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

// SVG Icons
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function ForkKnifeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17h.01M16 17h.01M9 11h6M5 11l1.5-4.5A2 2 0 018.38 5h7.24a2 2 0 011.88 1.5L19 11M5 11h14M5 11v6a1 1 0 001 1h1a1 1 0 001-1v-1h8v1a1 1 0 001 1h1a1 1 0 001-1v-6" />
    </svg>
  );
}

function BedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
