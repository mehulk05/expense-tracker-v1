import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '../utils/currency';
import { Link } from 'react-router-dom';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import { storage } from '../services/storage';
import { Expense, Account, Category, CreditCardBill } from '../types';
import { getSpendingInsights, parseNaturalLanguageExpense } from '../services/gemini';
import { ICONS } from '../constants';
import { AppCard } from '../components/ui/AppCard';
import { AppButton } from '../components/ui/AppButton';
import SummaryStats from '../components/dashboard/SummaryStats';
import SpendingTrendChart from '../components/dashboard/SpendingTrendChart';
import CategoryBarChart from '../components/dashboard/CategoryBarChart';
import FinancialInsights from '../components/dashboard/FinancialInsights';
import ActionableItems from '../components/dashboard/ActionableItems';
import SpendByCardChart from '../components/dashboard/SpendByCardChart';
import PendingTasksWidget from '@/components/dashboard/PendingTasksWidget';

const Dashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [splitExpenses, setSplitExpenses] = useState<any[]>([]);
  const [plannedExpenses, setPlannedExpenses] = useState<any[]>([]);
  const [creditCardBills, setCreditCardBills] = useState<CreditCardBill[]>([]);
  const [people, setPeople] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('month');

  const loadData = async () => {
    const [exps, accs, cats, todoList, splits, planned, ppl, bills] = await Promise.all([
      storage.getExpenses(),
      storage.getAccounts(),
      storage.getCategories(),
      storage.getTodos(),
      storage.getAllSplitExpenses(),
      storage.getPlannedExpenses(),
      storage.getPeople(),
      storage.getCreditCardBills()
    ]);
    setExpenses(exps);
    setAccounts(accs);
    setCategories(cats);
    setTodos(todoList);
    setSplitExpenses(splits);
    setPlannedExpenses(planned);
    setPeople(ppl);
    setCreditCardBills(bills);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const d = new Date(e.date);
      if (dateRange === 'week') return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      if (dateRange === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (dateRange === 'year') return d.getFullYear() === now.getFullYear();
      return true; // 'all'
    });
  }, [expenses, dateRange]);

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Group by Category
  const categoryData = categories.map(cat => {
    const value = filteredExpenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0);
    return { name: cat.name, value };
  }).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  const trendData = useMemo(() => {
    if (filteredExpenses.length === 0) return [];
    const dataMap: { [key: string]: number } = {};
    filteredExpenses.forEach(exp => {
        const dateKey = new Date(exp.date).toISOString().split('T')[0];
        dataMap[dateKey] = (dataMap[dateKey] || 0) + exp.amount;
    });

    // Create array for last 30 days or range (simplified)
    return Object.entries(dataMap)
        .map(([date, value]) => ({ name: new Date(date).toLocaleDateString(undefined, {month:'short', day:'numeric'}), value }))
        .sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime()); // Basic sort, can improve
  }, [filteredExpenses]);

  if (loading) return (
    <div className="space-y-10 animate-pulse">
      <div className="h-12 bg-slate-200 rounded-xl w-full"></div>
      <div className="grid grid-cols-6 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl col-span-1"></div>)}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">

      {/* 1. Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm py-4 border-b border-slate-200/50">
        <div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dashboard</h1>
           <p className="text-xs font-bold text-slate-500">Financial Command Center</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          {(['week', 'month', 'year', 'all'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${dateRange === range ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Summary Stats */}
      <SummaryStats
        totalSpent={totalSpent}
        dateRange={dateRange}
        pendingTasks={todos.filter(t => !t.completed).length}
        splitwiseNet={
            splitExpenses.reduce((net, exp) => {
                const myId = 'me';
                if (exp.paidBy === myId) return net + (exp.amount - (exp.shares?.[myId] || 0));
                return net - (exp.shares?.[myId] || 0);
            }, 0)
        }
        highestExpenseAmount={filteredExpenses.reduce((max, e) => Math.max(max, e.amount), 0)}
        topPaymentMethod={
            Object.entries(filteredExpenses.reduce((acc: any, e) => {
                const method = e.paymentMethod || 'Unknown';
                acc[method] = (acc[method] || 0) + 1;
                return acc;
            }, {}))
            .sort((a: any,b: any) => b[1] - a[1])[0]?.[0] || '-'
        }
        topCategory={(() => {
            const counts = filteredExpenses.reduce((acc: any, e) => {
                const cat = categories.find(c => c.id === e.categoryId)?.name || 'Unknown';
                acc[cat] = (acc[cat] || 0) + e.amount;
                return acc;
            }, {});
            const sorted = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1]);
            return { name: sorted[0]?.[0] || '-', value: sorted[0]?.[1] || 0 };
        })()}
        topCard={(() => {
            const counts = filteredExpenses.reduce((acc: any, e) => {
                const card = accounts.find(a => a.id === e.accountId)?.name || e.paymentMethod || 'Unknown';
                acc[card] = (acc[card] || 0) + e.amount;
                return acc;
            }, {});
            const sorted = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1]);
            return { name: sorted[0]?.[0] || '-', value: sorted[0]?.[1] || 0 };
        })()}
        transactionCount={filteredExpenses.length}
      />

      {/* 4. Financial Analysis Charts */}
      <div className="flex items-center gap-4">
        <div className="h-px bg-slate-200 flex-1" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Financial Analysis</span>
        <div className="h-px bg-slate-200 flex-1" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
         <CategoryBarChart data={categoryData} totalSpent={totalSpent} />
         <SpendByCardChart data={
             (() => {
                const counts = filteredExpenses.reduce((acc: any, e) => {
                    let name = 'Unknown';
                    const account = accounts.find(a => a.id === e.accountId);
                    if (account) {
                        name = account.lastFour ? `${account.name} (..${account.lastFour})` : account.name;
                    } else {
                        name = e.paymentMethod || 'Cash/Others';
                    }
                    acc[name] = (acc[name] || 0) + e.amount;
                    return acc;
                }, {});
                return Object.entries(counts)
                    .map(([name, value]) => ({ name, value: value as number }))
                    .sort((a, b) => b.value - a.value);
             })()
         } />
      </div>

      <div className="mb-8">
         <SpendingTrendChart data={trendData} loading={loading} />
      </div>

      {/* 3. Insights & Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <FinancialInsights
                expenses={filteredExpenses}
                categories={categoryData}
                totalSpent={totalSpent}
                upcomingBills={creditCardBills.filter(b => b.status !== 'paid')}
            />
        </div>
        <div className="lg:col-span-1">
            <PendingTasksWidget tasks={todos.filter(t => !t.completed)} />
        </div>
      </div>

      {/* 5. Actionable Items (Recent Activity & Bills) */}
      <div className="flex items-center gap-4">
        <div className="h-px bg-slate-200 flex-1" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Activity</span>
        <div className="h-px bg-slate-200 flex-1" />
      </div>

      <div className="grid grid-cols-1">
        <ActionableItems
            recentExpenses={filteredExpenses}
            upcomingBills={creditCardBills.filter(b => b.status !== 'paid')}
            pendingTodos={[]}
            showTasks={false}
        />
      </div>
    </div>
  );
};
export default Dashboard;