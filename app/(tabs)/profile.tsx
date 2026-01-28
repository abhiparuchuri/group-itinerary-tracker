import { View, Text, SafeAreaView, Pressable } from 'react-native';
import { useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button, Card, Input, Avatar } from '@/components/ui';
import { useUserStore } from '@/lib/stores/userStore';

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
    <SafeAreaView className="flex-1 bg-cream">
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <Animated.View entering={FadeInDown.delay(100)}>
          <Text className="text-3xl font-bold text-charcoal">Profile</Text>
        </Animated.View>
      </View>

      <View className="px-6 pt-6">
        {/* Profile Card */}
        <Animated.View entering={FadeInUp.delay(200)}>
          <Card className="items-center p-8">
            <Avatar
              name={user?.display_name || 'User'}
              imageUrl={user?.avatar_url}
              size="xl"
            />

            {isEditing ? (
              <View className="w-full mt-6">
                <Input
                  label="Display Name"
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Enter your name"
                  error={error}
                  autoCapitalize="words"
                  maxLength={30}
                />

                <View className="flex-row gap-3 mt-4">
                  <View className="flex-1">
                    <Button
                      onPress={() => {
                        setIsEditing(false);
                        setNewName(user?.display_name || '');
                        setError('');
                      }}
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                  </View>
                  <View className="flex-1">
                    <Button
                      onPress={handleSaveName}
                      disabled={isLoading || newName.trim().length < 2}
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </View>
                </View>
              </View>
            ) : (
              <>
                <Text className="text-2xl font-bold text-charcoal mt-4">
                  {user?.display_name}
                </Text>

                <Pressable
                  onPress={() => setIsEditing(true)}
                  className="flex-row items-center mt-2"
                >
                  <FontAwesome name="pencil" size={14} color="#9CA3AF" />
                  <Text className="text-gray-500 ml-2">Edit name</Text>
                </Pressable>
              </>
            )}
          </Card>
        </Animated.View>

        {/* Stats Section */}
        <Animated.View entering={FadeInUp.delay(400)} className="mt-6">
          <Text className="text-lg font-semibold text-charcoal mb-3">Quick Stats</Text>

          <View className="flex-row gap-4">
            <Card className="flex-1 items-center py-6">
              <Text className="text-3xl font-bold text-coral-500">0</Text>
              <Text className="text-gray-500 mt-1">Trips</Text>
            </Card>

            <Card className="flex-1 items-center py-6">
              <Text className="text-3xl font-bold text-teal-400">0</Text>
              <Text className="text-gray-500 mt-1">Places</Text>
            </Card>
          </View>
        </Animated.View>

        {/* App Info */}
        <Animated.View entering={FadeInUp.delay(600)} className="mt-8">
          <Card>
            <View className="flex-row items-center justify-between py-2">
              <Text className="text-charcoal">App Version</Text>
              <Text className="text-gray-500">1.0.0</Text>
            </View>

            <View className="h-px bg-gray-200 my-2" />

            <Pressable className="flex-row items-center justify-between py-2">
              <Text className="text-charcoal">Privacy Policy</Text>
              <FontAwesome name="chevron-right" size={12} color="#9CA3AF" />
            </Pressable>

            <View className="h-px bg-gray-200 my-2" />

            <Pressable className="flex-row items-center justify-between py-2">
              <Text className="text-charcoal">Terms of Service</Text>
              <FontAwesome name="chevron-right" size={12} color="#9CA3AF" />
            </Pressable>
          </Card>
        </Animated.View>

        {/* Footer */}
        <Animated.View entering={FadeInUp.delay(800)} className="mt-8 items-center">
          <Text className="text-gray-400 text-sm">
            Made with {'❤️'} for travelers
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
