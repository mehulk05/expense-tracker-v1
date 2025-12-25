
import React, { useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, LineChart, Line 
} from 'recharts';
import { storage } from '../services/storage';
import { Expense, Account, Category } from '../types';
import { getSpendingInsights } from '../services/gemini';

const Dashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [insights, setInsights] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [exps, accs, cats] = await Promise.all([
        storage.getExpenses(),
        storage.getAccounts(),
        storage.getCategories()
      ]);
      setExpenses(exps);
      setAccounts(accs);
      setCategories(cats);
      setLoading(false);
    };
    loadData();
  }, []);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  
  const categoryData = categories.map(cat => {
    const value = expenses
      .filter(e => e.categoryId === cat.id)
      .reduce((sum, e) => sum + e.amount, 0);
    return { name: cat.name, value };
  }).filter(item => item.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const amount = expenses
      .filter(e => e.date === dateStr)
      .reduce((sum, e) => sum + e.amount, 0);
    return { date: dateStr.split('-').slice(1).join('/'), amount };
  }).reverse();

  const handleGetInsights = async () => {
    setLoadingInsights(true);
    const text = await getSpendingInsights(expenses, accounts, categories);
    setInsights(text);
    setLoadingInsights(false);
  };

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Spent</p>
          <p className="text-3xl font-bold text-slate-800">₹{totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 mb-1">Expenses Count</p>
          <p className="text-3xl font-bold text-slate-800">{expenses.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 mb-1">Daily Avg</p>
          <p className="text-3xl font-bold text-slate-800">₹{expenses.length ? (totalSpent / (expenses.length || 1)).toFixed(0) : 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 mb-1">Accounts</p>
          <p className="text-3xl font-bold text-slate-800">{accounts.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Weekly Spending</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  formatter={(value: number) => [`₹${value}`, 'Spent']}
                />
                <Line type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">By Category</h3>
          <div className="h-[300px]">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₹${value}`, 'Spent']} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 italic">
                No categorical data available
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-lg shadow-indigo-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Smart Insights</h2>
            <p className="text-indigo-100">Let Gemini analyze your spending habits and give advice.</p>
          </div>
          <button 
            onClick={handleGetInsights}
            disabled={loadingInsights || expenses.length === 0}
            className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-semibold hover:bg-indigo-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loadingInsights ? "Analyzing..." : "Get AI Insights"}
          </button>
        </div>
        {insights && (
          <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm">
            <p className="whitespace-pre-wrap leading-relaxed">{insights}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
