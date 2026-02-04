import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '../utils/currency';
import { Link } from 'react-router-dom';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, BarChart, Bar, Legend, LineChart, Line
} from 'recharts';
import { storage } from '../services/storage';
import { Expense, Account, Category } from '../types';
import { getSpendingInsights, parseNaturalLanguageExpense } from '../services/gemini';
import { ICONS } from '../constants';
import { AppCard } from '../components/ui/AppCard';
import { AppButton } from '../components/ui/AppButton';

const Dashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [insights, setInsights] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [aiText, setAiText] = useState("");
  const [parsingAi, setParsingAi] = useState(false);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  const loadData = async () => {
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

  useEffect(() => { loadData(); }, []);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const d = new Date(e.date);
      if (dateRange === 'week') return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      if (dateRange === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      return d.getFullYear() === now.getFullYear();
    });
  }, [expenses, dateRange]);

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const personalTotal = filteredExpenses.filter(e => e.personalExpense ?? true).reduce((sum, e) => sum + e.amount, 0);
  const otherTotal = totalSpent - personalTotal;

  const categoryData = categories.map(cat => {
    const value = filteredExpenses.filter(e => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0);
    return { name: cat.name, value };
  }).filter(item => item.value > 0).sort((a, b) => b.value - a.value);

  const splitData = [
    { name: 'Personal', value: personalTotal },
    { name: 'Other', value: otherTotal }
  ].filter(d => d.value > 0);

  const trendData = useMemo(() => {
    if (filteredExpenses.length === 0) return [];

    const timestamps = filteredExpenses.map(e => new Date(e.date).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    const dataMap: { [key: string]: number } = {};
    filteredExpenses.forEach(exp => {
        const dateKey = new Date(exp.date).toISOString().split('T')[0]; 
        dataMap[dateKey] = (dataMap[dateKey] || 0) + exp.amount;
    });

    const result = [];
    const startDate = new Date(minTime);
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date(maxTime);
    endDate.setDate(endDate.getDate() + 1);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        const displayKey = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        result.push({
            name: displayKey,
            value: dataMap[dateKey] || 0
        });
    }

    return result;
  }, [filteredExpenses]);

  const paymentData = useMemo(() => {
    const data: { [key: string]: number } = {};
    filteredExpenses.forEach(exp => {
        const type = accounts.find(a => a.id === exp.accountId)?.type || exp.paymentMethod;
        data[type] = (data[type] || 0) + exp.amount;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses, accounts]);

  const accountData = useMemo(() => {
    const data: { [key: string]: number } = {};
    filteredExpenses.forEach(exp => {
        const acc = accounts.find(a => a.id === exp.accountId);
        const name = acc ? (acc.nickname || acc.name) : 'Unknown';
        data[name] = (data[name] || 0) + exp.amount;
    });
    return Object.entries(data)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
  }, [filteredExpenses, accounts]);

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiText || parsingAi) return;
    setParsingAi(true);
    const parsed = await parseNaturalLanguageExpense(aiText, accounts, categories);
    if (parsed && parsed.amount && parsed.accountId && parsed.categoryId) {
      const selectedAccount = accounts.find(a => a.id === parsed.accountId);
      const newExp = {
        id: crypto.randomUUID(),
        amount: parsed.amount,
        date: parsed.date || new Date().toISOString().split('T')[0],
        accountId: parsed.accountId,
        categoryId: parsed.categoryId,
        personalExpense: parsed.personalExpense ?? true,
        paymentMethod: selectedAccount ? selectedAccount.type : 'upi',
        description: parsed.description || aiText
      } as Expense;
      await storage.saveExpense(newExp);
      setExpenses([newExp, ...expenses]);
      setAiText("");
    }
    setParsingAi(false);
  };

  const handleGetInsights = async () => {
    if (loadingInsights || expenses.length === 0) return;
    setLoadingInsights(true);
    try {
      const result = await getSpendingInsights(expenses, accounts, categories);
      setInsights(result);
    } catch (error) {
      setInsights("Unable to generate analysis.");
    } finally {
      setLoadingInsights(false);
    }
  };

  const COLORS = ['#2563eb', '#06b6d4', '#8b5cf6', '#f59e0b', '#10b981'];

  if (loading) return (
    <div className="space-y-10">
      <div className="h-16 skeleton rounded-2xl w-full"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-36 skeleton rounded-xl"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-96 skeleton rounded-xl"></div>
        <div className="h-96 skeleton rounded-xl"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* AI Log Interaction Bar */}
      <section className="max-w-3xl mx-auto">
        <form onSubmit={handleAiSubmit} className="ai-input-bar flex items-center p-2.5">
          <div className="pl-4 pr-3 text-blue-600">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <input 
            type="text" 
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder="Log expense: 'Groceries 500 from ICICI'" 
            className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400 text-base font-bold py-3"
          />
          <AppButton 
            type="submit"
            disabled={parsingAi || !aiText}
            isLoading={parsingAi}
            className="rounded-xl ml-2 shadow-blue-100"
          >
             {parsingAi ? "PROCESSING" : "ADD ENTRY"}
          </AppButton>
        </form>
      </section>

      {/* Metrics Section */}
      <div className="space-y-6">
        <div className="flex justify-between items-end">
          <div className="flex bg-gray-200 p-1 rounded-xl w-fit border border-gray-300/30">
            {(['week', 'month', 'year'] as const).map(range => (
              <button 
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-8 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${dateRange === range ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { 
                label: 'Total Expenses', 
                val: formatCurrency(totalSpent), 
                icon: ICONS.Expense, 
                color: 'text-gray-900',
                subtext: ' Gross Outflow'
            },
            { 
                label: 'Avg Daily Spend', 
                val: formatCurrency(totalSpent / (dateRange === 'week' ? 7 : (dateRange === 'month' ? 30 : 365))), 
                icon: ICONS.Account, 
                color: 'text-blue-600',
                subtext: ' Daily Average'
            },
            { 
                label: 'Top Category', 
                val: categoryData.length > 0 ? categoryData[0].name : '-', 
                icon: ICONS.Category, 
                color: 'text-blue-600',
                subtext: categoryData.length > 0 ? formatCurrency(categoryData[0].value) : '-'
            },
            { 
                label: 'Transactions', 
                val: filteredExpenses.length, 
                icon: ICONS.Dashboard, 
                color: 'text-gray-900',
                subtext: ' Total Count'
            }
          ].map((m, i) => (
            <AppCard key={i} className="p-7 flex flex-col justify-between group">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{m.label}</span>
                <m.icon className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
              </div>
              <div>
                  <p className={`text-2xl font-bold ${m.color}`}>{m.val}</p>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{m.subtext}</p>
              </div>
            </AppCard>
          ))}
        </div>
      </div>
       
      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Trend Chart (Line) */}
        <AppCard className="p-8">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6">Spending Trend</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{fontSize: 10, fill: '#6b7280', fontWeight: 600}} axisLine={false} tickLine={false} />
                        <YAxis tick={{fontSize: 10, fill: '#6b7280', fontWeight: 600}} axisLine={false} tickLine={false} width={40} />
                        <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: '600', fontSize: '11px'}}
                            formatter={(value: number) => formatCurrency(value)}
                        />
                        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                     </LineChart>
                </ResponsiveContainer>
            </div>
        </AppCard>

        {/* Payment Method Split (Vertical Bar) */}
        <AppCard className="p-8">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6">Payment Methods</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentData} margin={{ left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{fontSize: 9, fill: '#6b7280', fontWeight: 600}} axisLine={false} tickLine={false} interval={0} />
                        <YAxis tick={{fontSize: 10, fill: '#6b7280', fontWeight: 600}} axisLine={false} tickLine={false} width={30} />
                        <Tooltip 
                            cursor={{fill: '#f9fafb'}}
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: '600', fontSize: '11px'}}
                            formatter={(value: number) => formatCurrency(value)}
                        />
                        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </AppCard>

        {/* Account / Card Split (Horizontal Bar) */}
        <AppCard className="p-8 lg:col-span-2">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6">Spending by Account / Card</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={accountData} margin={{ left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{fontSize: 9, fill: '#6b7280', fontWeight: 600}} axisLine={false} tickLine={false} interval={0} />
                        <YAxis tick={{fontSize: 10, fill: '#6b7280', fontWeight: 600}} axisLine={false} tickLine={false} width={30} tickFormatter={(val) => `₹${val/1000}k`} />
                        <Tooltip 
                            cursor={{fill: '#f9fafb'}}
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: '600', fontSize: '11px'}}
                            formatter={(value: number) => formatCurrency(value)}
                        />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </AppCard>

        {/* Category Breakdown (Pie) */}
        <AppCard className="p-8 lg:col-span-2">
           <div className="flex flex-col md:flex-row gap-8">
               <div className="flex-1">
                   <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-6">Category Distribution</h3>
                   <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={2} dataKey="value">
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: '700', color: '#6b7280'}} />
                            </PieChart>
                        </ResponsiveContainer>
                   </div>
               </div>
               
               {/* Insights Panel */}
               <div className="w-full md:w-1/3 bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-center">
                   <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Budget Insights</h4>
                   {categoryData.length > 0 && (
                       <div className="space-y-4">
                           <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                               <p className="text-gray-500 text-[10px] font-bold uppercase">Top Spend</p>
                               <p className="text-blue-600 font-bold text-lg">{categoryData[0].name}</p>
                               <p className="text-gray-400 text-xs font-semibold mt-1">
                                   {formatCurrency(categoryData[0].value)} 
                                   <span className="text-gray-300 ml-1">({Math.round((categoryData[0].value / totalSpent) * 100)}%)</span>
                               </p>
                           </div>
                           <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                               <p className="text-gray-500 text-[10px] font-bold uppercase">Budget Status</p>
                               <p className="text-emerald-600 font-bold text-lg">On Track</p> 
                               <p className="text-gray-400 text-xs font-semibold mt-1">Spending within normal limits</p>
                           </div>
                       </div>
                   )}
               </div>
           </div>
        </AppCard>
      </div>
      
      {/* Detailed Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <AppCard className="lg:col-span-2 p-8">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Top Expenses</h3>
                  <Link to="/expenses" className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">View All</Link>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full">
                      <thead>
                          <tr className="border-b border-gray-100">
                              <th className="py-3 text-left pl-4">Date</th>
                              <th className="py-3 text-left">Description</th>
                              <th className="py-3 text-left">Category</th>
                              <th className="py-3 text-right pr-4">Amount</th>
                          </tr>
                      </thead>
                      <tbody>
                          {filteredExpenses.sort((a,b) => b.amount - a.amount).slice(0, 5).map(exp => (
                              <tr key={exp.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                  <td className="py-4 pl-4 font-bold text-gray-400 text-xs">
                                      {new Date(exp.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                                  </td>
                                  <td className="py-4 font-bold text-gray-700 text-sm">{exp.description || 'Unspecified'}</td>
                                  <td className="py-4">
                                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                          {categories.find(c => c.id === exp.categoryId)?.name || 'Misc'}
                                      </span>
                                  </td>
                                  <td className="py-4 pr-4 text-right font-bold text-gray-900">{formatCurrency(exp.amount)}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </AppCard>

          {/* Alerts / AI Section Layout Update */}
          <div className="space-y-6">
               <AppCard className="p-8 bg-gray-900 text-white border-none shadow-xl shadow-gray-200">
                   <h3 className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-6">Smart Alerts</h3>
                   <div className="space-y-6">
                       <div className="flex gap-4">
                           <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                               <ICONS.Expense className="w-5 h-5" />
                           </div>
                           <div>
                               <p className="text-sm font-bold text-white">High Spending Detected</p>
                               <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                   Your top expense of {filteredExpenses.length > 0 ? formatCurrency([...filteredExpenses].sort((a,b) => b.amount - a.amount)[0].amount) : 0} is higher than usual.
                               </p>
                           </div>
                       </div>
                       <div className="flex gap-4">
                           <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                               <ICONS.Account className="w-5 h-5" />
                           </div>
                           <div>
                               <p className="text-sm font-bold text-white">Budget Efficiency</p>
                               <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                   You are maintaining a healthy 20% savings rate this month based on average inflow.
                               </p>
                           </div>
                       </div>
                   </div>
               </AppCard>

               <AppCard 
                  className="p-6 bg-blue-600 text-white border-none cursor-pointer hover:bg-blue-700 active:scale-[0.98] !shadow-none hover:!shadow-none" 
                  onClick={handleGetInsights}
                  hoverEffect={false}
                >
                   <div className="flex justify-between items-center">
                       <div>
                           <p className="text-xs font-bold uppercase tracking-widest text-blue-200">AI Analyst</p>
                           <p className="text-lg font-bold mt-1">Generate Report</p>
                       </div>
                       <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                       </div>
                   </div>
               </AppCard>
          </div>
      </div>

      {/* Full AI Intelligence Section */}
      {insights && (
          <div className="bg-white border-2 border-blue-100 rounded-[2.5rem] p-12 shadow-xl shadow-blue-50 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                      <ICONS.Dashboard className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">AI Financial Report</h2>
              </div>
              <p className="text-base leading-relaxed text-gray-600 whitespace-pre-wrap font-medium">{insights}</p>
          </div>
      )}
    </div>
  );
};

export default Dashboard;