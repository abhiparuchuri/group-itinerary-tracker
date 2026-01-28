import { TextInput, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { useState } from 'react';

const AnimatedView = Animated.createAnimatedComponent(View);

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  icon?: React.ReactNode;
  maxLength?: number;
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry = false,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  icon,
  maxLength,
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useSharedValue(0);

  const animatedBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusAnim.value,
      [0, 1],
      ['#E5E5E5', '#4ECDC4'] // Gray to Teal
    ),
    transform: [{ scale: withSpring(focusAnim.value === 1 ? 1.02 : 1, { damping: 15 }) }],
  }));

  function handleFocus() {
    setIsFocused(true);
    focusAnim.value = withSpring(1, { damping: 15, stiffness: 300 });
  }

  function handleBlur() {
    setIsFocused(false);
    focusAnim.value = withSpring(0, { damping: 15, stiffness: 300 });
  }

  return (
    <View className="w-full">
      {label && (
        <Text className="text-charcoal font-semibold mb-2 text-base">
          {label}
        </Text>
      )}

      <AnimatedView
        style={animatedBorderStyle}
        className={`
          flex-row items-center bg-white rounded-2xl px-4 py-3 border-2
          ${error ? 'border-coral-500' : ''}
        `}
      >
        {icon && <View className="mr-3">{icon}</View>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="flex-1 text-charcoal text-base"
        />
      </AnimatedView>

      {error && (
        <Text className="text-coral-500 text-sm mt-1 ml-1">
          {error}
        </Text>
      )}
    </View>
  );
}
