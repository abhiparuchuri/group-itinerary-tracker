import { Pressable, Text, View } from 'react-native';
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

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: 'bg-coral-500', text: 'text-white' },
  secondary: { bg: 'bg-teal-400', text: 'text-white' },
  outline: { bg: 'bg-transparent', text: 'text-coral-500', border: 'border-2 border-coral-500' },
  ghost: { bg: 'bg-transparent', text: 'text-charcoal' },
};

const sizeStyles: Record<ButtonSize, { container: string; text: string }> = {
  sm: { container: 'px-4 py-2', text: 'text-sm' },
  md: { container: 'px-6 py-3', text: 'text-base' },
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.95, { damping: 10, stiffness: 400 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 10, stiffness: 400 });
  }

  const { bg, text, border } = variantStyles[variant];
  const { container, text: textSize } = sizeStyles[size];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={animatedStyle}
      className={`
        ${bg} ${border || ''} ${container}
        rounded-2xl flex-row items-center justify-center
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50' : ''}
      `}
    >
      {icon && <View className="mr-2">{icon}</View>}
      <Text className={`${text} ${textSize} font-semibold`}>
        {children}
      </Text>
    </AnimatedPressable>
  );
}
