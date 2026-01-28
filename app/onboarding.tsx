import { View, Text, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Button, Input } from '@/components/ui';
import { useUserStore } from '@/lib/stores/userStore';

function FloatingOrb({
  size,
  color,
  top,
  left,
  right,
  delay
}: {
  size: number;
  color: string;
  top?: number;
  left?: number;
  right?: number;
  delay: number;
}) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(800)}
      style={[
        animatedStyle,
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
          right,
          opacity: 0.7,
        },
      ]}
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF9F0' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingHorizontal: 32, justifyContent: 'center' }}>
          {/* Floating decorative orbs */}
          <FloatingOrb size={120} color="#ffc9c9" top={60} left={-30} delay={0} />
          <FloatingOrb size={80} color="#81e6d9" top={100} right={-20} delay={200} />
          <FloatingOrb size={50} color="#fef08a" top={180} right={80} delay={400} />
          <FloatingOrb size={40} color="#ffc9c9" top={280} left={20} delay={300} />
          <FloatingOrb size={30} color="#81e6d9" top={320} right={40} delay={500} />

          {/* Hero section with icon */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={{ alignItems: 'center', marginBottom: 32 }}
          >
            <View
              style={{
                width: 112,
                height: 112,
                backgroundColor: 'white',
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                shadowColor: '#FF6B6B',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 24,
                elevation: 8,
              }}
            >
              <Text style={{ fontSize: 56 }}>{'✈️'}</Text>
            </View>
          </Animated.View>

          {/* Title and subtitle */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#2C3E50', textAlign: 'center', marginBottom: 8 }}>
              Welcome to
            </Text>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#FF6B6B', textAlign: 'center', marginBottom: 16 }}>
              TripTogether
            </Text>
            <Text style={{ fontSize: 18, color: '#6B7280', textAlign: 'center', lineHeight: 26, paddingHorizontal: 16 }}>
              Plan amazing adventures with your{'\n'}friends and family
            </Text>
          </Animated.View>

          {/* Input card */}
          <Animated.View
            entering={FadeInUp.delay(400).springify()}
            style={{
              backgroundColor: 'white',
              borderRadius: 24,
              padding: 24,
              marginBottom: 24,
              shadowColor: '#2C3E50',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <Input
              label="What should we call you?"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              error={error}
              autoCapitalize="words"
              maxLength={30}
            />

            <View style={{ marginTop: 24 }}>
              <Button
                onPress={handleContinue}
                disabled={isLoading || name.trim().length < 2}
                fullWidth
                size="lg"
              >
                {isLoading ? 'Setting up...' : "Let's Go! →"}
              </Button>
            </View>
          </Animated.View>

          {/* Footer note */}
          <Animated.View entering={FadeInUp.delay(600).springify()}>
            <Text style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
              No account needed • Your data syncs automatically
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
