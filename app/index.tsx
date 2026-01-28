import { Redirect } from 'expo-router';
import { useUserStore } from '@/lib/stores/userStore';

export default function Index() {
  const { isOnboarded } = useUserStore();

  if (isOnboarded) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}
