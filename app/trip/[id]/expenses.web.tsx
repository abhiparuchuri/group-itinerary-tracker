'use client';

import { useEffect, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Button } from '@/components/ui/Button.web';
import { Input } from '@/components/ui/Input.web';
import { Card } from '@/components/ui/Card.web';
import { useExpenseStore } from '@/lib/stores/expenseStore';
import { useUserStore } from '@/lib/stores/userStore';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types/database';
import { cn } from '@/lib/utils/cn';

interface TripMemberWithUser {
  user_id: string;
  user: User;
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const colors = [
    'bg-[#FF6B6B]',
    'bg-[#4ECDC4]',
    'bg-[#FFE66D]',
    'bg-[#95E1D3]',
    'bg-[#F38181]',
  ];

  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-bold',
        sizeClasses[size],
        colors[colorIndex]
      )}
    >
      {initials}
    </div>
  );
}

function Modal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
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
      setSelectedMembers(data.map((m: any) => m.user_id));
    }
  }

  async function handleAddExpense() {
    if (!user?.id || !description.trim() || !amount || selectedMembers.length === 0) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      alert('Please enter a valid amount');
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
    if (confirm(`Are you sure you want to delete "${desc}"?`)) {
      deleteExpense(expenseId);
    }
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
    <div className="min-h-screen bg-[#FFF9F0]">
      {/* Back button */}
      <div className="sticky top-0 bg-[#FFF9F0]/80 backdrop-blur-sm z-10 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-500 hover:text-[#2C3E50] transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-3xl font-bold text-[#2C3E50]">Expenses</h1>
        </div>

        {/* Summary Card */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <div className="bg-gradient-to-r from-[#FF6B6B] to-[#fa5252] rounded-3xl p-6 shadow-lg shadow-[#FF6B6B]/20">
            <p className="text-white/80 text-sm">Total Trip Expenses</p>
            <p className="text-white text-4xl font-bold mt-1">
              {formatCurrency(totalExpenses)}
            </p>
            <p className="text-white/80 text-sm mt-2">
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Balances */}
        {balances.length > 0 && (
          <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">Balances</h3>
            <Card className="divide-y divide-gray-100">
              {balances.map((balance) => (
                <div key={balance.userId} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center">
                    <Avatar name={balance.userName} size="sm" />
                    <span className="text-[#2C3E50] ml-3">{balance.userName}</span>
                  </div>
                  <span
                    className={cn(
                      'font-semibold',
                      balance.balance > 0
                        ? 'text-green-500'
                        : balance.balance < 0
                        ? 'text-[#FF6B6B]'
                        : 'text-gray-500'
                    )}
                  >
                    {balance.balance > 0
                      ? `gets back ${formatCurrency(balance.balance)}`
                      : balance.balance < 0
                      ? `owes ${formatCurrency(Math.abs(balance.balance))}`
                      : 'settled up'}
                  </span>
                </div>
              ))}
            </Card>
          </div>
        )}

        {/* Add Expense Button */}
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          <Button
            onPress={() => setShowAddExpense(true)}
            fullWidth
            icon={<PlusIcon className="w-4 h-4" />}
          >
            Add Expense
          </Button>
        </div>

        {/* Expenses List */}
        <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
          <h3 className="text-lg font-semibold text-[#2C3E50] mb-3">All Expenses</h3>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B6B]"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <span className="text-5xl mb-4">💸</span>
              <h2 className="text-xl font-semibold text-[#2C3E50] mb-2">No expenses yet</h2>
              <p className="text-gray-500 text-center">
                Add your first expense to start<br />tracking who owes what!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense, index) => (
                <div
                  key={expense.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Card>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-[#2C3E50] font-semibold">{expense.description}</p>
                        <div className="flex items-center mt-1">
                          <span className="text-gray-500 text-sm">Paid by </span>
                          <span className="text-gray-700 text-sm font-medium ml-1">
                            {expense.paidByUser?.display_name || 'Unknown'}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">
                          Split among {expense.splits.length} people
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[#FF6B6B] text-xl font-bold">
                          {formatCurrency(expense.amount)}
                        </span>
                        <button
                          onClick={() => handleDeleteExpense(expense.id, expense.description)}
                          className="mt-2 p-1 text-gray-400 hover:text-[#FF6B6B] transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal isOpen={showAddExpense} onClose={() => setShowAddExpense(false)}>
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-[#fff5f5] rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">💰</span>
            </div>
            <h2 className="text-2xl font-bold text-[#2C3E50]">Add Expense</h2>
          </div>

          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="e.g., Dinner at restaurant"
          />

          <div className="mt-4">
            <Input
              label="Amount (USD)"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              type="number"
            />
          </div>

          <div className="mt-4">
            <label className="block text-[#2C3E50] font-bold mb-3 text-base">Split among</label>
            <div className="flex flex-wrap gap-2">
              {members.map((member) => (
                <button
                  key={member.user_id}
                  onClick={() => toggleMemberSelection(member.user_id)}
                  className={cn(
                    'flex items-center px-3 py-2 rounded-full border-2 transition-colors',
                    selectedMembers.includes(member.user_id)
                      ? 'border-[#4ECDC4] bg-[#e6fffa]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <Avatar name={member.user.display_name} size="sm" />
                  <span
                    className={cn(
                      'ml-2',
                      selectedMembers.includes(member.user_id)
                        ? 'text-[#319795]'
                        : 'text-gray-600'
                    )}
                  >
                    {member.user.display_name}
                  </span>
                  {selectedMembers.includes(member.user_id) && (
                    <CheckIcon className="w-4 h-4 ml-1 text-[#4ECDC4]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {selectedMembers.length > 0 && amount && (
            <p className="text-gray-500 text-sm mt-3">
              Each person pays: {formatCurrency(parseFloat(amount || '0') / selectedMembers.length)}
            </p>
          )}

          <div className="flex gap-3 mt-6">
            <Button
              onPress={() => {
                setShowAddExpense(false);
                setDescription('');
                setAmount('');
              }}
              variant="ghost"
              fullWidth
            >
              Cancel
            </Button>
            <Button
              onPress={handleAddExpense}
              disabled={!description.trim() || !amount || selectedMembers.length === 0}
              fullWidth
            >
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
