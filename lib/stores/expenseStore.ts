import { create } from 'zustand';
import { supabase } from '../supabase';
import { Expense, ExpenseSplit, User } from '../types/database';

interface ExpenseWithDetails extends Expense {
  paidByUser?: User;
  splits: ExpenseSplit[];
}

interface BalanceSummary {
  userId: string;
  userName: string;
  balance: number; // positive = owed money, negative = owes money
}

interface ExpenseState {
  expenses: ExpenseWithDetails[];
  balances: BalanceSummary[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchExpenses: (tripId: string) => Promise<void>;
  addExpense: (
    tripId: string,
    expense: Partial<Expense>,
    splitAmong: string[]
  ) => Promise<Expense | null>;
  deleteExpense: (expenseId: string) => Promise<void>;
  settleExpense: (splitId: string) => Promise<void>;
  calculateBalances: (members: { id: string; display_name: string }[]) => void;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  expenses: [],
  balances: [],
  isLoading: false,
  error: null,

  fetchExpenses: async (tripId: string) => {
    set({ isLoading: true, error: null });

    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        *,
        paidByUser:users!paid_by(*)
      `)
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false });

    if (expensesError) {
      set({ isLoading: false, error: expensesError.message });
      return;
    }

    const expenses = (expensesData || []) as any[];

    // Fetch splits for all expenses
    const expenseIds = expenses.map((e) => e.id);

    if (expenseIds.length === 0) {
      set({ expenses: [], isLoading: false });
      return;
    }

    const { data: splitsData, error: splitsError } = await supabase
      .from('expense_splits')
      .select('*')
      .in('expense_id', expenseIds);

    if (splitsError) {
      set({ isLoading: false, error: splitsError.message });
      return;
    }

    const splits = (splitsData || []) as ExpenseSplit[];

    const expensesWithDetails: ExpenseWithDetails[] = expenses.map((expense) => ({
      ...expense,
      splits: splits.filter((s) => s.expense_id === expense.id),
    }));

    set({ expenses: expensesWithDetails, isLoading: false });
  },

  addExpense: async (
    tripId: string,
    expense: Partial<Expense>,
    splitAmong: string[]
  ) => {
    // Create the expense
    const { data: expenseData, error: expenseError } = await supabase
      .from('expenses')
      .insert({
        trip_id: tripId,
        description: expense.description || 'Expense',
        amount: expense.amount || 0,
        currency: expense.currency || 'USD',
        paid_by: expense.paid_by,
        split_type: expense.split_type || 'equal',
      } as any)
      .select()
      .single();

    if (expenseError || !expenseData) {
      console.error('Error adding expense:', expenseError);
      return null;
    }

    const newExpense = expenseData as Expense;

    // Calculate splits (equal split for now)
    const splitAmount = newExpense.amount / splitAmong.length;

    const splits = splitAmong.map((userId) => ({
      expense_id: newExpense.id,
      user_id: userId,
      amount: splitAmount,
      is_settled: userId === expense.paid_by, // Payer's share is auto-settled
    }));

    const { error: splitsError } = await supabase
      .from('expense_splits')
      .insert(splits as any);

    if (splitsError) {
      console.error('Error creating splits:', splitsError);
    }

    // Refresh expenses
    await get().fetchExpenses(tripId);

    return newExpense;
  },

  deleteExpense: async (expenseId: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);

    if (error) {
      console.error('Error deleting expense:', error);
      return;
    }

    const { expenses } = get();
    set({ expenses: expenses.filter((e) => e.id !== expenseId) });
  },

  settleExpense: async (splitId: string) => {
    const { error } = await (supabase.from('expense_splits') as any)
      .update({ is_settled: true, settled_at: new Date().toISOString() })
      .eq('id', splitId);

    if (error) {
      console.error('Error settling expense:', error);
      return;
    }

    const { expenses } = get();
    set({
      expenses: expenses.map((e) => ({
        ...e,
        splits: e.splits.map((s) =>
          s.id === splitId ? { ...s, is_settled: true } : s
        ),
      })),
    });
  },

  calculateBalances: (members: { id: string; display_name: string }[]) => {
    const { expenses } = get();
    const balanceMap = new Map<string, number>();

    // Initialize balances
    members.forEach((m) => balanceMap.set(m.id, 0));

    expenses.forEach((expense) => {
      const payerId = expense.paid_by;

      expense.splits.forEach((split) => {
        if (split.is_settled) return;

        if (split.user_id === payerId) {
          // Payer is owed this amount from others
          const currentBalance = balanceMap.get(payerId) || 0;
          balanceMap.set(payerId, currentBalance + (expense.amount - split.amount));
        } else {
          // This person owes their split amount
          const currentBalance = balanceMap.get(split.user_id) || 0;
          balanceMap.set(split.user_id, currentBalance - split.amount);
        }
      });
    });

    const balances: BalanceSummary[] = members.map((m) => ({
      userId: m.id,
      userName: m.display_name,
      balance: balanceMap.get(m.id) || 0,
    }));

    set({ balances });
  },
}));
