import { View, Text, SafeAreaView, ScrollView, Pressable, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Card, Button, Input, Avatar } from '@/components/ui';
import { useExpenseStore } from '@/lib/stores/expenseStore';
import { useUserStore } from '@/lib/stores/userStore';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types/database';

interface TripMemberWithUser {
  user_id: string;
  user: User;
}

export default function ExpensesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useUserStore((state) => state.user);
  const { expenses, balances, isLoading, fetchExpenses, addExpense, deleteExpense, calculateBalances } =
    useExpenseStore();

  const [members, setMembers] = useState<TripMemberWithUser[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      fetchExpenses(id);
      fetchMembers();
    }
  }, [id]);

  useEffect(() => {
    if (members.length > 0) {
      calculateBalances(members.map((m) => ({ id: m.user_id, display_name: m.user.display_name })));
    }
  }, [expenses, members]);

  async function fetchMembers() {
    const { data, error } = await supabase
      .from('trip_members')
      .select(`
        user_id,
        user:users(*)
      `)
      .eq('trip_id', id);

    if (!error && data) {
      setMembers(data as TripMemberWithUser[]);
      // Select all members by default
      setSelectedMembers(data.map((m: any) => m.user_id));
    }
  }

  async function handleAddExpense() {
    if (!user?.id || !description.trim() || !amount || selectedMembers.length === 0) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    await addExpense(
      id!,
      {
        description: description.trim(),
        amount: numericAmount,
        paid_by: user.id,
        split_type: 'equal',
      },
      selectedMembers
    );

    setDescription('');
    setAmount('');
    setSelectedMembers(members.map((m) => m.user_id));
    setShowAddExpense(false);
  }

  function handleDeleteExpense(expenseId: string, desc: string) {
    Alert.alert('Delete Expense', `Are you sure you want to delete "${desc}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteExpense(expenseId),
      },
    ]);
  }

  function toggleMemberSelection(userId: string) {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <>
      <Stack.Screen options={{ title: 'Expenses', headerShown: true }} />

      <SafeAreaView className="flex-1 bg-cream">
        <ScrollView className="flex-1 px-6">
          {/* Summary Card */}
          <Animated.View entering={FadeInDown.delay(100)} className="py-4">
            <Card className="bg-coral-500 p-6">
              <Text className="text-white/80 text-sm">Total Trip Expenses</Text>
              <Text className="text-white text-4xl font-bold mt-1">
                {formatCurrency(totalExpenses)}
              </Text>
              <Text className="text-white/80 text-sm mt-2">
                {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
              </Text>
            </Card>
          </Animated.View>

          {/* Balances */}
          {balances.length > 0 && (
            <Animated.View entering={FadeInUp.delay(200)} className="mb-6">
              <Text className="text-lg font-semibold text-charcoal mb-3">Balances</Text>
              <Card>
                {balances.map((balance, index) => (
                  <View key={balance.userId}>
                    {index > 0 && <View className="h-px bg-gray-100 my-3" />}
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Avatar name={balance.userName} size="sm" />
                        <Text className="text-charcoal ml-3">{balance.userName}</Text>
                      </View>
                      <Text
                        className={`font-semibold ${
                          balance.balance > 0
                            ? 'text-green-500'
                            : balance.balance < 0
                            ? 'text-coral-500'
                            : 'text-gray-500'
                        }`}
                      >
                        {balance.balance > 0
                          ? `gets back ${formatCurrency(balance.balance)}`
                          : balance.balance < 0
                          ? `owes ${formatCurrency(Math.abs(balance.balance))}`
                          : 'settled up'}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card>
            </Animated.View>
          )}

          {/* Add Expense Button */}
          <View className="mb-4">
            <Button
              onPress={() => setShowAddExpense(true)}
              icon={<FontAwesome name="plus" size={16} color="white" />}
              fullWidth
            >
              Add Expense
            </Button>
          </View>

          {/* Expenses List */}
          <Text className="text-lg font-semibold text-charcoal mb-3">All Expenses</Text>

          {isLoading ? (
            <View className="items-center py-8">
              <Text className="text-gray-500">Loading expenses...</Text>
            </View>
          ) : expenses.length === 0 ? (
            <Animated.View entering={FadeInUp} className="items-center py-12">
              <Text className="text-5xl mb-4">{'💸'}</Text>
              <Text className="text-xl font-semibold text-charcoal mb-2">No expenses yet</Text>
              <Text className="text-gray-500 text-center">
                Add your first expense to start{'\n'}tracking who owes what!
              </Text>
            </Animated.View>
          ) : (
            expenses.map((expense, index) => (
              <Animated.View key={expense.id} entering={FadeInUp.delay(100 * index)}>
                <Card className="mb-3">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="text-charcoal font-semibold">{expense.description}</Text>
                      <View className="flex-row items-center mt-1">
                        <Text className="text-gray-500 text-sm">Paid by </Text>
                        <Text className="text-gray-700 text-sm font-medium">
                          {expense.paidByUser?.display_name || 'Unknown'}
                        </Text>
                      </View>
                      <Text className="text-gray-400 text-xs mt-1">
                        Split among {expense.splits.length} people
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-coral-500 text-xl font-bold">
                        {formatCurrency(expense.amount)}
                      </Text>
                      <Pressable
                        onPress={() => handleDeleteExpense(expense.id, expense.description)}
                        className="mt-2 p-1"
                      >
                        <FontAwesome name="trash" size={14} color="#9CA3AF" />
                      </Pressable>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            ))
          )}

          <View className="h-8" />
        </ScrollView>

        {/* Add Expense Modal */}
        {showAddExpense && (
          <View className="absolute inset-0 bg-black/50 items-center justify-center px-6">
            <Animated.View entering={FadeInUp.springify()} className="w-full">
              <Card className="p-6">
                <Text className="text-2xl font-bold text-charcoal mb-4">Add Expense</Text>

                <Input
                  label="Description"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="e.g., Dinner at restaurant"
                />

                <View className="mt-4">
                  <Input
                    label="Amount (USD)"
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    keyboardType="numeric"
                  />
                </View>

                <Text className="text-charcoal font-semibold mt-4 mb-2">Split among</Text>
                <View className="flex-row flex-wrap gap-2">
                  {members.map((member) => (
                    <Pressable
                      key={member.user_id}
                      onPress={() => toggleMemberSelection(member.user_id)}
                      className={`
                        flex-row items-center px-3 py-2 rounded-full border-2
                        ${
                          selectedMembers.includes(member.user_id)
                            ? 'border-teal-400 bg-teal-50'
                            : 'border-gray-200 bg-white'
                        }
                      `}
                    >
                      <Avatar name={member.user.display_name} size="sm" />
                      <Text
                        className={`ml-2 ${
                          selectedMembers.includes(member.user_id)
                            ? 'text-teal-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {member.user.display_name}
                      </Text>
                      {selectedMembers.includes(member.user_id) && (
                        <FontAwesome name="check" size={12} color="#4ECDC4" className="ml-1" />
                      )}
                    </Pressable>
                  ))}
                </View>

                {selectedMembers.length > 0 && amount && (
                  <Text className="text-gray-500 text-sm mt-2">
                    Each person pays:{' '}
                    {formatCurrency(parseFloat(amount || '0') / selectedMembers.length)}
                  </Text>
                )}

                <View className="flex-row gap-3 mt-6">
                  <View className="flex-1">
                    <Button
                      onPress={() => {
                        setShowAddExpense(false);
                        setDescription('');
                        setAmount('');
                      }}
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                  </View>
                  <View className="flex-1">
                    <Button
                      onPress={handleAddExpense}
                      disabled={!description.trim() || !amount || selectedMembers.length === 0}
                    >
                      Add
                    </Button>
                  </View>
                </View>
              </Card>
            </Animated.View>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}
