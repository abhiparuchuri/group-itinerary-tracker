import { View, Text, Image } from 'react-native';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: AvatarSize;
}

const sizeClasses: Record<AvatarSize, { container: string; text: string; pixels: number }> = {
  sm: { container: 'w-8 h-8', text: 'text-sm', pixels: 32 },
  md: { container: 'w-12 h-12', text: 'text-lg', pixels: 48 },
  lg: { container: 'w-16 h-16', text: 'text-2xl', pixels: 64 },
  xl: { container: 'w-24 h-24', text: 'text-4xl', pixels: 96 },
};

// Generate consistent color from name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-coral-400',
    'bg-teal-400',
    'bg-sunny-300',
    'bg-purple-400',
    'bg-pink-400',
    'bg-indigo-400',
    'bg-emerald-400',
    'bg-orange-400',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  const words = name.trim().split(' ');
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({ name, imageUrl, size = 'md' }: AvatarProps) {
  const { container, text, pixels } = sizeClasses[size];
  const bgColor = getAvatarColor(name);

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        className={`${container} rounded-full`}
        style={{ width: pixels, height: pixels }}
      />
    );
  }

  return (
    <View className={`${container} ${bgColor} rounded-full items-center justify-center`}>
      <Text className={`${text} font-bold text-white`}>
        {getInitials(name)}
      </Text>
    </View>
  );
}
