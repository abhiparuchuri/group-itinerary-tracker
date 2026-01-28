import { Pressable, Text, View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const variantConfig: Record<ButtonVariant, {
  bg: string;
  text: string;
  border?: string;
  shadowColor: string;
}> = {
  primary: { bg: 'bg-coral-500', text: 'text-white', shadowColor: '#FF6B6B' },
  secondary: { bg: 'bg-teal-400', text: 'text-white', shadowColor: '#4ECDC4' },
  outline: { bg: 'bg-transparent', text: 'text-coral-500', border: 'border-2 border-coral-500', shadowColor: 'transparent' },
  ghost: { bg: 'bg-transparent', text: 'text-charcoal', shadowColor: 'transparent' },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: 'px-5 py-2.5', text: 'text-sm' },
  md: { container: 'px-6 py-3.5', text: 'text-base' },
  lg: { container: 'px-8 py-4', text: 'text-lg' },
};

export function Button({
  onPress,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  icon,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.25);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.96, { damping: 12, stiffness: 400 });
    shadowOpacity.value = withSpring(0.15);
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 12, stiffness: 400 });
    shadowOpacity.value = withSpring(0.25);
  }

  const { bg, text, border, shadowColor } = variantConfig[variant];
  const { container, text: textSize } = sizeStyles[size];

  const shadowStyle = variant === 'primary' || variant === 'secondary' ? {
    shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  } : {};

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, shadowStyle]}
      className={`
        ${bg} ${border || ''} ${container}
        rounded-2xl flex-row items-center justify-center
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50' : ''}
      `}
    >
      {icon && <View className="mr-2">{icon}</View>}
      <Text className={`${text} ${textSize} font-bold tracking-wide`}>
        {children}
      </Text>
    </AnimatedPressable>
  );
}
