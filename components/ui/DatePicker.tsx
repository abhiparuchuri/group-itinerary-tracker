import { useState } from 'react';
import { View, Text, Pressable, Platform, Modal } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  minimumDate,
  maximumDate,
}: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  function handleChange(event: DateTimePickerEvent, selectedDate?: Date) {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      onChange(selectedDate);
      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
    } else if (event.type === 'dismissed') {
      setShowPicker(false);
    }
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <View className="w-full">
      {label && (
        <Text className="text-charcoal font-semibold mb-2 text-base">{label}</Text>
      )}

      <Pressable
        onPress={() => setShowPicker(true)}
        className="flex-row items-center bg-white rounded-2xl px-4 py-3 border-2 border-gray-200"
      >
        <FontAwesome name="calendar" size={18} color="#9CA3AF" />
        <Text className={`flex-1 ml-3 ${value ? 'text-charcoal' : 'text-gray-400'}`}>
          {value ? formatDate(value) : placeholder}
        </Text>
        <FontAwesome name="chevron-down" size={12} color="#9CA3AF" />
      </Pressable>

      {showPicker && Platform.OS === 'ios' && (
        <Modal transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl">
              <View className="flex-row justify-between items-center px-6 py-4 border-b border-gray-200">
                <Pressable onPress={() => setShowPicker(false)}>
                  <Text className="text-gray-500 text-base">Cancel</Text>
                </Pressable>
                <Text className="text-charcoal font-semibold text-base">Select Date</Text>
                <Pressable onPress={() => setShowPicker(false)}>
                  <Text className="text-coral-500 font-semibold text-base">Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={value || new Date()}
                mode="date"
                display="spinner"
                onChange={handleChange}
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                style={{ height: 200 }}
              />
            </View>
          </View>
        </Modal>
      )}

      {showPicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
}
