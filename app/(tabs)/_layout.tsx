import React from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

type IconName = 'suitcase' | 'user';

function TabBarIcon({ name, focused }: { name: IconName; focused: boolean }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(focused ? 1.1 : 1, { damping: 15, stiffness: 300 }) }
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View
        className={`
          p-2 rounded-xl
          ${focused ? 'bg-coral-100' : 'bg-transparent'}
        `}
      >
        <FontAwesome
          name={name}
          size={24}
          color={focused ? '#FF6B6B' : '#9CA3AF'}
        />
      </View>
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontWeight: '600',
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Trips',
          tabBarIcon: ({ focused }) => <TabBarIcon name="suitcase" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabBarIcon name="user" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
