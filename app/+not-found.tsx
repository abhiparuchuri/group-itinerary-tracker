import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 bg-cream items-center justify-center p-6">
        <Text className="text-6xl mb-4">{'🤔'}</Text>
        <Text className="text-2xl font-bold text-charcoal mb-2">Page Not Found</Text>
        <Text className="text-gray-500 text-center mb-6">
          This screen doesn't exist.
        </Text>

        <Link href="/" className="bg-coral-500 px-6 py-3 rounded-2xl">
          <Text className="text-white font-semibold">Go to Home</Text>
        </Link>
      </View>
    </>
  );
}
