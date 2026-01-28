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
      ['#E8E8E8', '#4ECDC4'] // Light gray to Teal
    ),
  }));

  const animatedShadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: withSpring(focusAnim.value === 1 ? 0.12 : 0.04, { damping: 15 }),
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
        <Text className="text-charcoal font-bold mb-3 text-base">
          {label}
        </Text>
      )}

      <AnimatedView
        style={[
          animatedBorderStyle,
          animatedShadowStyle,
          {
            shadowColor: '#4ECDC4',
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 8,
            elevation: 2,
          }
        ]}
        className={`
          flex-row items-center bg-gray-50 rounded-2xl px-5 py-4 border-2
          ${error ? 'border-coral-500' : ''}
        `}
      >
        {icon && <View className="mr-3">{icon}</View>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#A0AEC0"
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          maxLength={maxLength}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="flex-1 text-charcoal text-lg font-medium"
          style={{ fontSize: 18 }}
        />
      </AnimatedView>

      {error && (
        <Animated.View
          entering={require('react-native-reanimated').FadeIn.duration(200)}
          className="flex-row items-center mt-2 ml-1"
        >
          <Text className="text-coral-500 text-sm font-medium">
            {error}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
