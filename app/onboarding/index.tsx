import { View, Text, SafeAreaView } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { Button, Input } from '@/components/ui';
import { useUserStore } from '@/lib/stores/userStore';

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
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-1 px-6 justify-center">
        {/* Decorative elements */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          className="absolute top-20 left-10 w-20 h-20 bg-coral-200 rounded-full opacity-60"
        />
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          className="absolute top-40 right-8 w-14 h-14 bg-teal-200 rounded-full opacity-60"
        />
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          className="absolute top-32 right-32 w-8 h-8 bg-sunny-200 rounded-full opacity-80"
        />

        {/* Content */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <Text className="text-5xl mb-2">
            <Text>{'✈️'}</Text>
          </Text>
          <Text className="text-4xl font-bold text-charcoal mb-2">
            Welcome to{'\n'}TripTogether
          </Text>
          <Text className="text-lg text-gray-600 mb-8">
            Plan amazing trips with your friends and family
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).springify()}>
          <Input
            label="What should we call you?"
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            error={error}
            autoCapitalize="words"
            maxLength={30}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).springify()} className="mt-8">
          <Button
            onPress={handleContinue}
            disabled={isLoading || name.trim().length < 2}
            fullWidth
            size="lg"
          >
            {isLoading ? 'Setting up...' : "Let's Go!"}
          </Button>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(800).springify()} className="mt-6">
          <Text className="text-center text-gray-500 text-sm">
            No account needed. Your data syncs automatically.
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
