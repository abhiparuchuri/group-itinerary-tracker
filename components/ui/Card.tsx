import { View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
  variant?: 'elevated' | 'outlined' | 'filled' | 'custom';
}

export function Card({
  children,
  onPress,
  className = '',
  variant = 'elevated',
}: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    }
  }

  function handlePressOut() {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    }
  }

  const variantClasses = {
    elevated: 'bg-white shadow-lg shadow-charcoal/10',
    outlined: 'bg-white border-2 border-gray-200',
    filled: 'bg-cream',
    custom: '', // No default background, allows custom colors via className
  };

  const baseClasses = `rounded-3xl p-4 ${variantClasses[variant]} ${className}`;

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
        className={baseClasses}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return <View className={baseClasses}>{children}</View>;
}
